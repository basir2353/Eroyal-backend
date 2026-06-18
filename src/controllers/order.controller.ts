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
      },
      result.emailConfirmationSent
        ? "Order created and confirmation email sent"
        : result.emailConfirmationError
          ? `Order created. Email not sent: ${result.emailConfirmationError}`
          : "Order created",
      201,
    );
  } catch (e) {
    return sendError(res, e instanceof Error ? e.message : "Failed to create order", 400);
  }
}
