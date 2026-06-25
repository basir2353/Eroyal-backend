import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { sendError } from "../utils/apiResponse.js";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(err);

  if (
    err.message === "Invalid category selected" ||
    err.message === "Category is required" ||
    err.message.startsWith("Regular price") ||
    err.message.startsWith("Sale price") ||
    err.message.startsWith("Price ")
  ) {
    return sendError(res, err.message, 400);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const field = Array.isArray(err.meta?.target) ? err.meta.target.join(", ") : "field";
      return sendError(res, `A record with this ${field} already exists`, 409);
    }
    if (err.code === "P2025") {
      return sendError(res, "Record not found", 404);
    }
  }

  sendError(res, err.message || "Internal server error", 500);
}
