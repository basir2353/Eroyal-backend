import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { userRepository } from "../repositories/user.repository.js";
import { prisma } from "../lib/prisma.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { paramId } from "../utils/params.js";
import { mapUser, serialize, serializeMany } from "../utils/serialize.js";

export async function listUsers(_req: AuthRequest, res: Response) {
  const users = await userRepository.list();
  return sendSuccess(
    res,
    serializeMany(users).map((u) => mapUser(u as Record<string, unknown>)),
  );
}

export async function createUser(req: AuthRequest, res: Response) {
  let roleId = req.body.roleId;
  if (!roleId && req.body.role) {
    const role = await prisma.role.findUnique({ where: { name: req.body.role } });
    roleId = role?.id;
  }
  const user = await userRepository.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    roleId,
    phone: req.body.phone,
  });
  return sendSuccess(
    res,
    mapUser(serialize(user) as Record<string, unknown>),
    "User created",
    201,
  );
}

export async function updateUser(req: AuthRequest, res: Response) {
  const data = { ...req.body };
  if (data.role && !data.roleId) {
    const role = await prisma.role.findUnique({ where: { name: data.role } });
    if (role) data.roleId = role.id;
    delete data.role;
  }
  if (data.isActive !== undefined) {
    data.status = data.isActive ? "ACTIVE" : "INACTIVE";
    delete data.isActive;
  }
  const user = await userRepository.update(paramId(req.params.id), data);
  return sendSuccess(res, mapUser(serialize(user) as Record<string, unknown>));
}
