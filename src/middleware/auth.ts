import type { NextFunction, Request, Response } from "express";
import { userRepository } from "../repositories/user.repository.js";
import { ROLE_PERMISSIONS } from "../types/roles.js";
import type { Permission, Role } from "../types/roles.js";
import { sendError } from "../utils/apiResponse.js";
import { verifyToken } from "../utils/jwt.js";

export type AuthRequest = Request & {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: Permission[];
  };
};

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return sendError(res, "Unauthorized", 401);
    }

    const token = header.split(" ")[1];
    const payload = verifyToken(token);
    const user = await userRepository.findById(payload.id);

    if (!user || user.status !== "ACTIVE") {
      return sendError(res, "Unauthorized", 401);
    }

    const dbPermissions = userRepository.getPermissions(user);
    const permissions =
      dbPermissions.length > 0
        ? (dbPermissions as Permission[])
        : ROLE_PERMISSIONS[user.role.name as Role];

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
    };

    next();
  } catch {
    return sendError(res, "Invalid or expired token", 401);
  }
}

export function authorize(...required: Permission[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const hasAll = required.every((p) => req.user!.permissions.includes(p));
    if (!hasAll) return sendError(res, "Forbidden", 403);

    next();
  };
}
