import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import {
  buildOrderConfirmationHtml,
  buildOrderConfirmationSubject,
  buildOrderConfirmationText,
  type OrderConfirmationTemplateData,
} from "../templates/orderConfirmationEmail.js";
import {
  buildPaymentCompleteHtml,
  buildPaymentCompleteSubject,
  buildPaymentCompleteText,
  type PaymentCompleteTemplateData,
} from "../templates/paymentCompleteEmail.js";
import { logger } from "../utils/logger.js";

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type EmailTransportConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  fromName: string;
  source: "env" | "database";
};

export type EmailStatus = {
  configured: boolean;
  verified: boolean;
  source: "env" | "database" | null;
  host: string | null;
  port: number | null;
  user: string | null;
  from: string | null;
  fromName: string | null;
  error: string | null;
};

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

function resolveFromEmail(config: EmailTransportConfig) {
  const isGmail = config.host.toLowerCase().includes("gmail.com");
  if (isGmail && config.from.toLowerCase() !== config.user.toLowerCase()) {
    return config.user;
  }
  return config.from;
}

function isPlaceholderPassword(pass: string) {
  const normalized = pass.trim().toLowerCase();
  return (
    !normalized ||
    normalized === "your-email-password" ||
    normalized === "your-app-password" ||
    normalized === "your-password" ||
    normalized === "changeme" ||
    normalized === "replace_with_real_email_password"
  );
}

function formatFromAddress(config: EmailTransportConfig) {
  const fromEmail = resolveFromEmail(config);
  return config.fromName ? `"${config.fromName}" <${fromEmail}>` : fromEmail;
}

async function getEmailTransportConfig(): Promise<EmailTransportConfig | null> {
  const envConfig = env.email;
  if (envConfig.host && envConfig.user && envConfig.pass) {
    if (isPlaceholderPassword(envConfig.pass)) {
      return null;
    }
    return {
      host: envConfig.host,
      port: envConfig.port,
      user: envConfig.user,
      pass: envConfig.pass,
      from: envConfig.from || envConfig.user,
      fromName: envConfig.fromName,
      source: "env",
    };
  }

  const settings = await prisma.emailSettings.findFirst();
  if (settings?.smtpHost && settings.smtpUser && settings.smtpPass) {
    if (isPlaceholderPassword(settings.smtpPass)) {
      return null;
    }
    return {
      host: settings.smtpHost,
      port: settings.smtpPort ?? 587,
      user: settings.smtpUser,
      pass: settings.smtpPass,
      from: settings.senderEmail ?? envConfig.from ?? settings.smtpUser,
      fromName: settings.senderName ?? envConfig.fromName,
      source: "database",
    };
  }

  return null;
}

function createTransporter(config: EmailTransportConfig) {
  const secure = config.port === 465;

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure,
    requireTLS: !secure && config.port === 587,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      minVersion: "TLSv1.2",
    },
  });
}

export async function getEmailStatus(): Promise<EmailStatus> {
  const config = await getEmailTransportConfig();
  if (!config) {
    const envConfig = env.email;
    let error = "Email not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in backend/.env";

    if (envConfig.host && envConfig.user && isPlaceholderPassword(envConfig.pass)) {
      error =
        "EMAIL_PASS is still the placeholder. Set the real password for info@eroyalmango.com in backend/.env";
    } else if (envConfig.host?.includes("mail.eroyalmango.com")) {
      error =
        "EMAIL_HOST mail.eroyalmango.com does not exist. For Hostinger email use smtp.hostinger.com";
    }

    return {
      configured: false,
      verified: false,
      source: null,
      host: envConfig.host || null,
      port: envConfig.port || null,
      user: envConfig.user ? maskEmail(envConfig.user) : null,
      from: envConfig.from || null,
      fromName: envConfig.fromName || null,
      error,
    };
  }

  try {
    const transporter = createTransporter(config);
    await Promise.race([
      transporter.verify(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("SMTP verification timed out after 8s")), 8_000),
      ),
    ]);

    return {
      configured: true,
      verified: true,
      source: config.source,
      host: config.host,
      port: config.port,
      user: maskEmail(config.user),
      from: resolveFromEmail(config),
      fromName: config.fromName,
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "SMTP verification failed";
    return {
      configured: true,
      verified: false,
      source: config.source,
      host: config.host,
      port: config.port,
      user: maskEmail(config.user),
      from: resolveFromEmail(config),
      fromName: config.fromName,
      error: message,
    };
  }
}

export async function sendMail(input: SendMailInput) {
  const config = await getEmailTransportConfig();
  if (!config) {
    throw new Error(
      "Email transport is not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in backend/.env",
    );
  }

  const transporter = createTransporter(config);
  const fromAddress = formatFromAddress(config);

  logger.info("Sending email", {
    to: input.to,
    subject: input.subject,
    host: config.host,
    port: config.port,
    from: fromAddress,
  });

  const info = await transporter.sendMail({
    from: fromAddress,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: env.email.from !== config.user ? config.user : undefined,
  });

  logger.info("Email sent successfully", {
    to: input.to,
    messageId: info.messageId,
  });

  return info;
}

export async function sendOrderConfirmationEmail(
  to: string,
  data: OrderConfirmationTemplateData,
) {
  const subject = buildOrderConfirmationSubject(data);
  const html = buildOrderConfirmationHtml(data);
  const text = buildOrderConfirmationText(data);

  return sendMail({ to, subject, html, text });
}

export async function sendPaymentCompleteEmail(
  to: string,
  data: PaymentCompleteTemplateData,
) {
  const subject = buildPaymentCompleteSubject(data);
  const html = buildPaymentCompleteHtml(data);
  const text = buildPaymentCompleteText(data);

  return sendMail({ to, subject, html, text });
}

export async function sendTestEmail(to: string) {
  const sample: OrderConfirmationTemplateData = {
    customerName: "Test Customer",
    orderId: "test-order-id",
    orderNumber: "ERM-TEST123",
    orderDate: new Intl.DateTimeFormat("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date()),
    items: [
      { name: "White Chaunsa", quantity: 1, lineTotal: 1500, weight: "5kg" },
    ],
    totalAmount: 1500,
    orderStatus: "PENDING",
    storefrontUrl: env.frontendUrl,
  };

  return sendOrderConfirmationEmail(to, sample);
}

export async function verifyEmailTransport() {
  const status = await getEmailStatus();
  if (!status.configured) {
    throw new Error(status.error ?? "Email transport is not configured");
  }
  if (!status.verified) {
    throw new Error(status.error ?? "SMTP verification failed");
  }
  return status;
}
