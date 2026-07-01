import type { Order, OrderItem } from "@prisma/client";
import { env } from "../config/env.js";
import { orderRepository } from "../repositories/order.repository.js";
import { getEmailStatus, sendOrderConfirmationEmail, sendPaymentCompleteEmail } from "./email.service.js";
import { sendOrderPlacedSms } from "./sms.service.js";
import { settingsRepository } from "../repositories/settings.repository.js";
import type { CreateOrderInput } from "../validators/order.validator.js";
import { logger } from "../utils/logger.js";
import type { OrderConfirmationTemplateData } from "../templates/orderConfirmationEmail.js";
import type { PaymentCompleteTemplateData } from "../templates/paymentCompleteEmail.js";

type OrderWithRelations = Order & {
  items: OrderItem[];
  customer?: { email?: string | null; name?: string | null; phone?: string | null } | null;
};

function decimalToNumber(value: unknown) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value) || 0;
}

function formatOrderDate(date: Date) {
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function extractCustomerEmail(order: OrderWithRelations) {
  const info = order.customerInfo as {
    email?: string;
    name?: string;
  } | null;

  return (
    info?.email?.trim().toLowerCase() ||
    order.customer?.email?.trim().toLowerCase() ||
    ""
  );
}

function extractCustomerName(order: OrderWithRelations) {
  const info = order.customerInfo as { name?: string } | null;
  return info?.name?.trim() || order.customer?.name?.trim() || "Customer";
}

function extractCustomerPhone(order: OrderWithRelations) {
  const info = order.customerInfo as { phone?: string } | null;
  return info?.phone?.trim() || order.customer?.phone?.trim() || "";
}

function buildTemplateData(order: OrderWithRelations): OrderConfirmationTemplateData {
  return {
    customerName: extractCustomerName(order),
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderDate: formatOrderDate(order.createdAt),
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      lineTotal: decimalToNumber(item.lineTotal),
      weight: item.weight,
    })),
    totalAmount: decimalToNumber(order.total),
    orderStatus: order.orderStatus,
    storefrontUrl: env.frontendUrl,
  };
}

function buildPaymentCompleteTemplateData(order: OrderWithRelations): PaymentCompleteTemplateData {
  return {
    customerName: extractCustomerName(order),
    orderNumber: order.orderNumber,
    totalAmount: decimalToNumber(order.total),
    paymentDate: formatOrderDate(new Date()),
    storefrontUrl: env.frontendUrl,
  };
}

export type CreatePublicOrderResult = {
  order: OrderWithRelations;
  emailConfirmationSent: boolean;
  emailConfirmationError: string | null;
  orderSmsSent: boolean;
  orderSmsError: string | null;
  requiresPaymentReceipt: boolean;
  message: string;
};

export type CompletePaymentResult = {
  order: OrderWithRelations;
  paymentCompleteEmailSent: boolean;
  paymentCompleteEmailError: string | null;
  message: string;
};

function isBankTransferOrder(order: OrderWithRelations) {
  return order.paymentMethod === "direct_bank_transfer";
}

export const orderService = {
  async sendOrderSmsForOrder(order: OrderWithRelations) {
    const phone = extractCustomerPhone(order);
    if (!phone) {
      const message = "Customer phone is missing; order SMS was not sent.";
      logger.warn(message, { orderId: order.id, orderNumber: order.orderNumber });
      await orderRepository.markOrderSmsFailed(order.id, message);
      return { sent: false, error: message };
    }

    try {
      const website = await settingsRepository.getWebsite();
      const result = await sendOrderPlacedSms({
        phone,
        customerName: extractCustomerName(order),
        orderNumber: order.orderNumber,
        total: decimalToNumber(order.total),
        paymentMethod: order.paymentMethod,
        siteName: website.siteName ?? "E Royal Mango",
      });

      if (result.skipped) {
        return { sent: false, error: null };
      }

      await orderRepository.markOrderSmsSent(order.id);
      logger.info("Order SMS sent", {
        orderId: order.id,
        orderNumber: order.orderNumber,
        phone,
      });
      return { sent: true, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send order SMS";
      logger.error("Order SMS failed", {
        orderId: order.id,
        orderNumber: order.orderNumber,
        phone,
        error: message,
      });
      await orderRepository.markOrderSmsFailed(order.id, message);
      return { sent: false, error: message };
    }
  },

  async createPublicOrder(input: CreateOrderInput): Promise<CreatePublicOrderResult> {
    const order = (await orderRepository.create(input)) as OrderWithRelations;

    if (!order) {
      throw new Error("Failed to create order");
    }

    const smsResult = await orderService.sendOrderSmsForOrder(order);
    const refreshedAfterSms = (await orderRepository.findById(order.id)) as OrderWithRelations;

    if (isBankTransferOrder(order)) {
      return {
        order: refreshedAfterSms ?? order,
        emailConfirmationSent: false,
        emailConfirmationError: null,
        orderSmsSent: smsResult.sent,
        orderSmsError: smsResult.error,
        requiresPaymentReceipt: true,
        message: smsResult.sent
          ? "Order created. Complete your bank transfer payment and upload the receipt. SMS sent."
          : smsResult.error
            ? `Order created. Complete payment and upload receipt. SMS not sent: ${smsResult.error}`
            : "Order created. Complete your bank transfer payment and upload the receipt.",
      };
    }

    const confirmation = await orderService.sendConfirmationForOrder(refreshedAfterSms ?? order);
    return {
      ...confirmation,
      order: (await orderRepository.findById(order.id)) as OrderWithRelations,
      orderSmsSent: smsResult.sent,
      orderSmsError: smsResult.error,
      requiresPaymentReceipt: false,
      message: [
        confirmation.message,
        smsResult.sent ? "Order SMS sent." : smsResult.error ? `SMS not sent: ${smsResult.error}` : null,
      ]
        .filter(Boolean)
        .join(" "),
    };
  },

  async sendConfirmationForOrder(
    order: OrderWithRelations,
  ): Promise<CreatePublicOrderResult> {
    const recipientEmail = extractCustomerEmail(order);
    if (!recipientEmail) {
      const message = "Customer email is missing; confirmation email was not sent.";
      logger.warn(message, { orderId: order.id, orderNumber: order.orderNumber });
      await orderRepository.markConfirmationEmailFailed(order.id, message);
      const refreshed = (await orderRepository.findById(order.id)) as OrderWithRelations;
      return {
        order: refreshed ?? order,
        emailConfirmationSent: false,
        emailConfirmationError: message,
        orderSmsSent: false,
        orderSmsError: null,
        requiresPaymentReceipt: false,
        message,
      };
    }

    try {
      const emailStatus = await getEmailStatus();
      if (!emailStatus.verified) {
        throw new Error(emailStatus.error ?? "Email service is not configured or not connected");
      }

      const templateData = buildTemplateData(order);
      await sendOrderConfirmationEmail(recipientEmail, templateData);
      await orderRepository.markConfirmationEmailSent(order.id);

      logger.info("Order confirmation email sent", {
        orderId: order.id,
        orderNumber: order.orderNumber,
        recipientEmail,
      });

      const refreshed = (await orderRepository.findById(order.id)) as OrderWithRelations;

      return {
        order: refreshed ?? order,
        emailConfirmationSent: true,
        emailConfirmationError: null,
        orderSmsSent: false,
        orderSmsError: null,
        requiresPaymentReceipt: false,
        message: "Order confirmation email sent",
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send confirmation email";

      logger.error("Order confirmation email failed", {
        orderId: order.id,
        orderNumber: order.orderNumber,
        recipientEmail,
        error: message,
      });

      await orderRepository.markConfirmationEmailFailed(order.id, message);

      const refreshed = (await orderRepository.findById(order.id)) as OrderWithRelations;

      return {
        order: refreshed ?? order,
        emailConfirmationSent: false,
        emailConfirmationError: message,
        orderSmsSent: false,
        orderSmsError: null,
        requiresPaymentReceipt: false,
        message,
      };
    }
  },

  async resendConfirmationEmail(orderId: string): Promise<CreatePublicOrderResult> {
    const order = (await orderRepository.findById(orderId)) as OrderWithRelations | null;
    if (!order) {
      throw new Error("Order not found");
    }
    return orderService.sendConfirmationForOrder(order);
  },

  async completeOrderPayment(orderId: string, note?: string): Promise<CompletePaymentResult> {
    const order = (await orderRepository.markPaymentComplete(orderId, note)) as OrderWithRelations;
    const recipientEmail = extractCustomerEmail(order);

    if (!recipientEmail) {
      const message = "Payment marked complete. Customer email is missing; notification was not sent.";
      logger.warn(message, { orderId: order.id, orderNumber: order.orderNumber });
      return {
        order,
        paymentCompleteEmailSent: false,
        paymentCompleteEmailError: "Customer email is missing",
        message,
      };
    }

    try {
      const emailStatus = await getEmailStatus();
      if (!emailStatus.verified) {
        throw new Error(emailStatus.error ?? "Email service is not configured or not connected");
      }

      const templateData = buildPaymentCompleteTemplateData(order);
      await sendPaymentCompleteEmail(recipientEmail, templateData);

      logger.info("Payment complete email sent", {
        orderId: order.id,
        orderNumber: order.orderNumber,
        recipientEmail,
      });

      return {
        order,
        paymentCompleteEmailSent: true,
        paymentCompleteEmailError: null,
        message: "Payment marked as complete and customer notified by email",
      };
    } catch (error) {
      const emailError =
        error instanceof Error ? error.message : "Failed to send payment complete email";

      logger.error("Payment complete email failed", {
        orderId: order.id,
        orderNumber: order.orderNumber,
        recipientEmail,
        error: emailError,
      });

      return {
        order,
        paymentCompleteEmailSent: false,
        paymentCompleteEmailError: emailError,
        message: `Payment marked complete. Email not sent: ${emailError}`,
      };
    }
  },
};
