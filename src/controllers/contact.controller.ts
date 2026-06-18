import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { contactRepository } from "../repositories/content.repository.js";
import { getPagination, sendSuccess } from "../utils/apiResponse.js";
import { paramId } from "../utils/params.js";
import { serialize, serializeMany } from "../utils/serialize.js";

export async function listContactMessages(req: AuthRequest, res: Response) {
  const { page, limit, skip } = getPagination(req.query);
  const [items, total] = await contactRepository.list(skip, limit);
  return sendSuccess(res, { items: serializeMany(items), pagination: { page, limit, total } });
}

export async function updateContactMessage(req: AuthRequest, res: Response) {
  const msg = await contactRepository.update(paramId(req.params.id), req.body);
  return sendSuccess(res, serialize(msg));
}

export async function createPublicContact(req: AuthRequest, res: Response) {
  const msg = await contactRepository.create(req.body);
  return sendSuccess(res, serialize(msg), "Message sent", 201);
}
