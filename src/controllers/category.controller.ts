import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { categoryRepository } from "../repositories/content.repository.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { paramId } from "../utils/params.js";
import { createSlug } from "../utils/slug.js";
import { serialize, serializeMany } from "../utils/serialize.js";

export async function listCategories(_req: AuthRequest, res: Response) {
  return sendSuccess(res, serializeMany(await categoryRepository.list()));
}

export async function createCategory(req: AuthRequest, res: Response) {
  const slug = req.body.slug || createSlug(req.body.name);
  const cat = await categoryRepository.create({ ...req.body, slug });
  return sendSuccess(res, serialize(cat), "Category created", 201);
}

export async function updateCategory(req: AuthRequest, res: Response) {
  try {
    const cat = await categoryRepository.update(paramId(req.params.id), req.body);
    return sendSuccess(res, serialize(cat));
  } catch {
    return sendError(res, "Not found", 404);
  }
}

export async function deleteCategory(req: AuthRequest, res: Response) {
  await categoryRepository.delete(paramId(req.params.id));
  return sendSuccess(res, null, "Deleted");
}

export async function listPublicCategories(_req: AuthRequest, res: Response) {
  return sendSuccess(res, serializeMany(await categoryRepository.list()));
}
