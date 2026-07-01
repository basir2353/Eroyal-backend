import { env } from "../config/env.js";
import { settingsRepository } from "../repositories/settings.repository.js";
import { logger } from "../utils/logger.js";
import {
  DEFAULT_ORDER_SMS_TEMPLATE,
  formatPaymentMethodLabel,
  normalizePhoneNumber,
  renderOrderSmsTemplate,
  type OrderSmsTemplateData,
} from "../utils/smsTemplate.js";

export type SmsChannel = "sms" | "whatsapp" | "auto";

export type SmsStatus = {
  configured: boolean;
  smsReady: boolean;
  whatsAppReady: boolean;
  accountSid: string | null;
  phoneNumber: string | null;
  whatsAppFrom: string | null;
  error: string | null;
};

type TwilioSendResult = {
  sid?: string;
  status?: string;
  error_message?: string;
  message?: string;
};

function mask(value: string) {
  if (value.length <= 4) return "****";
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

function getTwilioConfig() {
  const accountSid = env.twilio.accountSid.trim();
  const authToken = env.twilio.authToken.trim();
  const phoneNumber = env.twilio.phoneNumber.trim();
  const whatsAppFrom = env.twilio.whatsAppFrom.trim();

  return { accountSid, authToken, phoneNumber, whatsAppFrom };
}

export async function getSmsStatus(): Promise<SmsStatus> {
  const { accountSid, authToken, phoneNumber, whatsAppFrom } = getTwilioConfig();

  if (!accountSid || !authToken) {
    return {
      configured: false,
      smsReady: false,
      whatsAppReady: false,
      accountSid: accountSid ? mask(accountSid) : null,
      phoneNumber: phoneNumber || null,
      whatsAppFrom: whatsAppFrom || null,
      error:
        "Twilio is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in backend/.env",
    };
  }

  const smsReady = Boolean(phoneNumber);
  const whatsAppReady = Boolean(whatsAppFrom);

  if (!smsReady && !whatsAppReady) {
    return {
      configured: true,
      smsReady: false,
      whatsAppReady: false,
      accountSid: mask(accountSid),
      phoneNumber: null,
      whatsAppFrom: null,
      error: "Set TWILIO_PHONE_NUMBER for SMS and/or TWILIO_WHATSAPP_FROM for WhatsApp.",
    };
  }

  return {
    configured: true,
    smsReady,
    whatsAppReady,
    accountSid: mask(accountSid),
    phoneNumber,
    whatsAppFrom,
    error: null,
  };
}

async function sendTwilioMessage(input: {
  to: string;
  body: string;
  channel: "sms" | "whatsapp";
}) {
  const { accountSid, authToken, phoneNumber, whatsAppFrom } = getTwilioConfig();
  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials are not configured.");
  }

  const from =
    input.channel === "whatsapp"
      ? whatsAppFrom.startsWith("whatsapp:")
        ? whatsAppFrom
        : `whatsapp:${whatsAppFrom}`
      : phoneNumber;

  if (!from) {
    throw new Error(
      input.channel === "whatsapp"
        ? "TWILIO_WHATSAPP_FROM is not configured."
        : "TWILIO_PHONE_NUMBER is not configured.",
    );
  }

  const to =
    input.channel === "whatsapp"
      ? input.to.startsWith("whatsapp:")
        ? input.to
        : `whatsapp:${input.to}`
      : input.to;

  const params = new URLSearchParams({
    To: to,
    From: from,
    Body: input.body,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    },
  );

  const json = (await response.json()) as TwilioSendResult;
  if (!response.ok) {
    throw new Error(json.message ?? json.error_message ?? "Twilio request failed.");
  }

  return json;
}

async function dispatchMessage(to: string, body: string, channel: SmsChannel) {
  const status = await getSmsStatus();
  if (!status.configured) {
    throw new Error(status.error ?? "SMS service is not configured.");
  }

  if (channel === "whatsapp") {
    return sendTwilioMessage({ to, body, channel: "whatsapp" });
  }

  if (channel === "sms") {
    return sendTwilioMessage({ to, body, channel: "sms" });
  }

  if (status.whatsAppReady) {
    try {
      return await sendTwilioMessage({ to, body, channel: "whatsapp" });
    } catch (error) {
      if (!status.smsReady) throw error;
      logger.warn("WhatsApp send failed, falling back to SMS", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return sendTwilioMessage({ to, body, channel: "sms" });
}

export async function sendSmsMessage(to: string, body: string, channel: SmsChannel = "sms") {
  const normalized = normalizePhoneNumber(to);
  if (!normalized) throw new Error("Invalid phone number.");

  logger.info("Sending SMS/WhatsApp message", { to: normalized, channel });
  const result = await dispatchMessage(normalized, body, channel);
  logger.info("SMS/WhatsApp message sent", { to: normalized, sid: result.sid, channel });
  return result;
}

export async function sendOrderPlacedSms(input: {
  phone: string;
  customerName: string;
  orderNumber: string;
  total: number;
  paymentMethod: string;
  siteName?: string;
}) {
  const settings = await settingsRepository.getSms();
  if (!settings.enabled || !settings.orderPlacedEnabled) {
    return { sent: false, skipped: true, error: null as string | null };
  }

  const template = settings.orderPlacedTemplate?.trim() || DEFAULT_ORDER_SMS_TEMPLATE;
  const templateData: OrderSmsTemplateData = {
    customerName: input.customerName,
    orderNumber: input.orderNumber,
    total: Math.round(input.total).toLocaleString("en-PK"),
    phone: input.phone,
    paymentMethod: formatPaymentMethodLabel(input.paymentMethod),
    siteName: input.siteName ?? "E Royal Mango",
  };

  const body = renderOrderSmsTemplate(template, templateData);
  const channel = (settings.channel ?? "sms") as SmsChannel;

  await sendSmsMessage(input.phone, body, channel);
  return { sent: true, skipped: false, error: null as string | null };
}

export async function sendTestOrderSms(to: string) {
  const settings = await settingsRepository.getSms();
  const template = settings.orderPlacedTemplate?.trim() || DEFAULT_ORDER_SMS_TEMPLATE;
  const body = renderOrderSmsTemplate(template, {
    customerName: "Test Customer",
    orderNumber: "ERM-TEST123",
    total: "1,500",
    phone: to,
    paymentMethod: "Cash on delivery",
    siteName: "E Royal Mango",
  });

  const channel = (settings.channel ?? "sms") as SmsChannel;
  return sendSmsMessage(to, body, channel);
}
