import type { Order, OrderItem } from "@prisma/client";
import { env } from "../config/env.js";
import { orderRepository } from "../repositories/order.repository.js";
import { getEmailStatus, sendOrderConfirmationEmail } from "./email.service.js";
import type { CreateOrderInput } from "../validators/order.validator.js";
import { logger } from "../utils/logger.js";
import type { OrderConfirmationTemplateData } from "../templates/orderConfirmationEmail.js";

type OrderWithRelations = Order & {
  items: OrderItem[];
  customer?: { email?: string | null; name?: string | null } | null;
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

export type CreatePublicOrderResult = {
  order: OrderWithRelations;
  emailConfirmationSent: boolean;
  emailConfirmationError: string | null;
};

export const orderService = {
  async createPublicOrder(input: CreateOrderInput): Promise<CreatePublicOrderResult> {
    const order = (await orderRepository.create(input)) as OrderWithRelations;

    if (!order) {
      throw new Error("Failed to create order");
    }

    return orderService.sendConfirmationForOrder(order);
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
};
