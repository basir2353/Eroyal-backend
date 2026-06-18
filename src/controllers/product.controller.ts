import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { productRepository } from "../repositories/product.repository.js";
import { getPagination, sendError, sendSuccess } from "../utils/apiResponse.js";
import { paramId } from "../utils/params.js";
import { createSlug, ensureUniqueSlug } from "../utils/slug.js";
import { mapProduct, serializeMany } from "../utils/serialize.js";

export async function listProducts(req: AuthRequest, res: Response) {
  const { page, limit, skip } = getPagination(req.query);
  const { items, total } = await productRepository.list(req.query, skip, limit);
  return sendSuccess(res, {
    items: serializeMany(items).map((p) => mapProduct(p as Record<string, unknown>)),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function getProduct(req: AuthRequest, res: Response) {
  const product = await productRepository.findBySlug(paramId(req.params.slug));
  if (!product) return sendError(res, "Product not found", 404);
  return sendSuccess(res, mapProduct(serializeMany([product])[0] as Record<string, unknown>));
}

export async function getPublicProduct(req: AuthRequest, res: Response) {
  const product = await productRepository.findBySlug(paramId(req.params.slug));
  if (!product || product.status !== "PUBLISHED") {
    return sendError(res, "Product not found", 404);
  }
  return sendSuccess(res, mapProduct(serializeMany([product])[0] as Record<string, unknown>, { publicView: true }));
}

export async function createProduct(req: AuthRequest, res: Response) {
  const baseSlug = String(req.body.slug ?? "").trim() || createSlug(req.body.name);
  const slug = await ensureUniqueSlug(baseSlug);
  const product = await productRepository.create({ ...req.body, slug });
  return sendSuccess(
    res,
    mapProduct(serializeMany([product!])[0] as Record<string, unknown>),
    "Product created",
    201,
  );
}

export async function updateProduct(req: AuthRequest, res: Response) {
  const id = paramId(req.params.id);
  const payload = { ...req.body };

  if (payload.slug !== undefined || payload.name !== undefined) {
    const existing = await productRepository.findById(id);
    if (!existing) return sendError(res, "Product not found", 404);

    const baseSlug =
      String(payload.slug ?? "").trim() ||
      createSlug(String(payload.name ?? existing.name));
    payload.slug = await ensureUniqueSlug(baseSlug, id);
  }

  const product = await productRepository.update(id, payload);
  if (!product) return sendError(res, "Product not found", 404);
  return sendSuccess(res, mapProduct(serializeMany([product])[0] as Record<string, unknown>));
}

export async function deleteProduct(req: AuthRequest, res: Response) {
  try {
    await productRepository.delete(paramId(req.params.id));
    return sendSuccess(res, null, "Product deleted");
  } catch {
    return sendError(res, "Product not found", 404);
  }
}

export async function bulkProductAction(req: AuthRequest, res: Response) {
  const { ids, action } = req.body;
  if (!Array.isArray(ids) || !action) return sendError(res, "Invalid bulk request");
  await productRepository.bulkAction(ids, action);
  return sendSuccess(res, null, "Bulk action completed");
}

export async function listPublicProducts(req: AuthRequest, res: Response) {
  const { items } = await productRepository.list(
    { ...req.query, status: "published" },
    0,
    500,
  );
  return sendSuccess(
    res,
    serializeMany(items).map((p) => mapProduct(p as Record<string, unknown>, { publicView: true })),
  );
}
