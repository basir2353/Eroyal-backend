import crypto from "crypto";
import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { userRepository } from "../repositories/user.repository.js";
import { ROLE_PERMISSIONS } from "../types/roles.js";
import type { Permission, Role } from "../types/roles.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { comparePassword } from "../utils/password.js";
import { mapUser, serialize } from "../utils/serialize.js";
import { signToken } from "../utils/jwt.js";

function resolvePermissions(
  roleName: string,
  dbPermissions: string[],
): Permission[] {
  if (dbPermissions.length > 0) return dbPermissions as Permission[];
  return ROLE_PERMISSIONS[roleName as Role] ?? [];
}

export async function login(req: AuthRequest, res: Response) {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");
  if (!email || !password) return sendError(res, "Email and password required");

  const user = await userRepository.findByEmail(email);
  if (!user || user.status !== "ACTIVE") return sendError(res, "Invalid email or password", 401);

  const valid = await comparePassword(password, user.password);
  if (!valid) return sendError(res, "Invalid email or password", 401);

  const permissions = resolvePermissions(
    user.role.name,
    userRepository.getPermissions(user),
  );

  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role.name as Role,
    permissions,
  });

  return sendSuccess(res, {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      permissions,
    },
  });
}

export async function register(req: AuthRequest, res: Response) {
  const { name, email, password, roleId } = req.body;
  if (!name || !email || !password) return sendError(res, "Name, email and password required");

  const existing = await userRepository.findByEmail(email);
  if (existing) return sendError(res, "Email already registered", 409);

  const adminRole = roleId
    ? { id: roleId }
    : await prisma.role.findUnique({ where: { name: "admin" } });

  if (!adminRole?.id) return sendError(res, "Default role not found", 500);

  const user = await userRepository.create({
    name,
    email,
    password,
    roleId: adminRole.id,
  });

  return sendSuccess(
    res,
    mapUser(serialize(user) as Record<string, unknown>),
    "User registered",
    201,
  );
}

export async function me(req: AuthRequest, res: Response) {
  const user = await userRepository.findById(req.user!.id);
  if (!user) return sendError(res, "User not found", 404);
  return sendSuccess(res, {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
    permissions: req.user!.permissions,
  });
}

export async function changePassword(req: AuthRequest, res: Response) {
  const { currentPassword, newPassword } = req.body;
  const user = await userRepository.findById(req.user!.id);
  if (!user) return sendError(res, "User not found", 404);

  const valid = await comparePassword(currentPassword, user.password);
  if (!valid) return sendError(res, "Current password is incorrect", 400);

  await userRepository.updatePassword(user.id, newPassword);
  return sendSuccess(res, null, "Password updated");
}

export async function forgotPassword(req: AuthRequest, res: Response) {
  const { email } = req.body;
  const user = await userRepository.findByEmail(email);
  if (!user) return sendSuccess(res, null, "If account exists, reset email sent");

  const token = crypto.randomBytes(32).toString("hex");
  await userRepository.update(user.id, {
    resetPasswordToken: token,
    resetPasswordExpires: new Date(Date.now() + 3600000),
  });

  return sendSuccess(res, { resetToken: token }, "Reset instructions sent");
}

export async function resetPassword(req: AuthRequest, res: Response) {
  const { token, password } = req.body;
  const user = await userRepository.findByResetToken(token);
  if (!user) return sendError(res, "Invalid or expired reset token", 400);

  await userRepository.updatePassword(user.id, password);
  await userRepository.update(user.id, {
    resetPasswordToken: null,
    resetPasswordExpires: null,
  });

  return sendSuccess(res, null, "Password reset successful");
}
