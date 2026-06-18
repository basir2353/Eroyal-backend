import type { Response } from "express";

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = "Success",
  status = 200,
) {
  return res.status(status).json({ success: true, message, data });
}

export function sendError(
  res: Response,
  message: string,
  status = 400,
  errors?: unknown,
) {
  return res.status(status).json({ success: false, message, errors });
}

export function getPagination(query: {
  page?: string;
  limit?: string;
}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
