import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { orderRepository } from "../repositories/order.repository.js";
import { orderService } from "../services/order.service.js";
import { getPagination, sendError, sendSuccess } from "../utils/apiResponse.js";
import { paramId } from "../utils/params.js";
import { mapOrder, serializeMany } from "../utils/serialize.js";

export async function listOrders(req: AuthRequest, res: Response) {
  const { page, limit, skip } = getPagination(req.query);
  const { items, total } = await orderRepository.list(req.query, skip, limit);
  return sendSuccess(res, {
    items: serializeMany(items).map((o) => mapOrder(o as Record<string, unknown>)),
    pagination: { page, limit, total },
  });
}

export async function getOrder(req: AuthRequest, res: Response) {
  const order = await orderRepository.findById(paramId(req.params.id));
  if (!order) return sendError(res, "Not found", 404);
  return sendSuccess(res, mapOrder(serializeMany([order])[0] as Record<string, unknown>));
}

export async function updateOrderStatus(req: AuthRequest, res: Response) {
  const { status, note, trackingNumber } = req.body;
  try {
    const order = await orderRepository.updateStatus(
      paramId(req.params.id),
      status,
      note,
      trackingNumber,
    );
    return sendSuccess(
      res,
      mapOrder(serializeMany([order])[0] as Record<string, unknown>),
      "Order updated",
    );
  } catch {
    return sendError(res, "Not found", 404);
  }
}

export async function resendOrderConfirmation(req: AuthRequest, res: Response) {
  try {
    const result = await orderService.resendConfirmationEmail(paramId(req.params.id));
    const mappedOrder = mapOrder(
      serializeMany([result.order])[0] as Record<string, unknown>,
    );

    if (!result.emailConfirmationSent) {
      return sendError(
        res,
        result.emailConfirmationError ?? "Failed to send confirmation email",
        400,
      );
    }

    return sendSuccess(
      res,
      {
        ...mappedOrder,
        emailConfirmationSent: true,
        emailConfirmationError: null,
      },
      "Order confirmation email resent",
    );
  } catch (e) {
    return sendError(
      res,
      e instanceof Error ? e.message : "Failed to resend confirmation email",
      404,
    );
  }
}

export async function listPaymentVerifications(req: AuthRequest, res: Response) {
  const { page, limit, skip } = getPagination(req.query);
  const filterRaw = String(req.query.filter ?? "pending_review");
  const filter =
    filterRaw === "awaiting_receipt" || filterRaw === "completed"
      ? filterRaw
      : "pending_review";

  const { items, total } = await orderRepository.listPaymentVerifications(filter, skip, limit);
  return sendSuccess(res, {
    items: serializeMany(items).map((o) => mapOrder(o as Record<string, unknown>)),
    pagination: { page, limit, total },
    filter,
  });
}

export async function completeOrderPayment(req: AuthRequest, res: Response) {
  const note = typeof req.body?.note === "string" ? req.body.note : undefined;
  try {
    const result = await orderService.completeOrderPayment(paramId(req.params.id), note);
    return sendSuccess(
      res,
      {
        ...mapOrder(serializeMany([result.order])[0] as Record<string, unknown>),
        paymentCompleteEmailSent: result.paymentCompleteEmailSent,
        paymentCompleteEmailError: result.paymentCompleteEmailError,
      },
      result.message,
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update payment";
    const status = message === "Not found" ? 404 : 400;
    return sendError(res, message, status);
  }
}

export async function createPublicOrder(req: AuthRequest, res: Response) {
  try {
    const result = await orderService.createPublicOrder(req.body);
    const mappedOrder = mapOrder(
      serializeMany([result.order])[0] as Record<string, unknown>,
    );

    return sendSuccess(
      res,
      {
        ...mappedOrder,
        emailConfirmationSent: result.emailConfirmationSent,
        emailConfirmationError: result.emailConfirmationError,
        orderSmsSent: result.orderSmsSent,
        orderSmsError: result.orderSmsError,
        requiresPaymentReceipt: result.requiresPaymentReceipt,
      },
      result.message,
      201,
    );
  } catch (e) {
    return sendError(res, e instanceof Error ? e.message : "Failed to create order", 400);
  }
}

export async function uploadPaymentReceipt(req: AuthRequest, res: Response) {
  const orderId = paramId(req.params.id);
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  if (!email) return sendError(res, "Email is required to verify your order.");
  if (!req.file) return sendError(res, "Please upload your payment receipt image.");

  const order = await orderRepository.findById(orderId);
  if (!order) return sendError(res, "Order not found", 404);
  if (order.paymentMethod !== "direct_bank_transfer") {
    return sendError(res, "This order does not require a bank transfer receipt.");
  }

  const info = order.customerInfo as { email?: string } | null;
  const orderEmail = info?.email?.trim().toLowerCase() ?? order.customer?.email?.trim().toLowerCase() ?? "";
  if (orderEmail !== email) return sendError(res, "Email does not match this order.", 403);

  let receiptUrl = "";
  const { UPLOADS_DIR } = await import("../config/paths.js");
  const fs = await import("fs/promises");
  const path = await import("path");
  const { env } = await import("../config/env.js");

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const ext = path.extname(req.file.originalname) || ".jpg";
  const filename = `receipt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  await fs.writeFile(path.join(UPLOADS_DIR, filename), req.file.buffer);
  const apiPublic = process.env.API_PUBLIC_URL ?? `http://localhost:${env.port}`;
  receiptUrl = `/uploads/${filename}`;

  const updated = await orderRepository.attachPaymentReceipt(orderId, receiptUrl);
  const result = await orderService.sendConfirmationForOrder(updated as never);

  return sendSuccess(
    res,
    {
      ...mapOrder(serializeMany([result.order])[0] as Record<string, unknown>),
      emailConfirmationSent: result.emailConfirmationSent,
      emailConfirmationError: result.emailConfirmationError,
      paymentReceiptUrl: receiptUrl,
    },
    "Payment receipt uploaded successfully",
  );
}
