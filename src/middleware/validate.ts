import type { NextFunction, Response } from "express";
import type { ZodSchema } from "zod";
import type { AuthRequest } from "./auth.js";
import { sendError } from "../utils/apiResponse.js";

export function validateBody(schema: ZodSchema) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Validation failed";
      return sendError(res, message, 422);
    }
  };
}
