import slugify from "slugify";
import { prisma } from "../lib/prisma.js";

export function createSlug(text: string): string {
  return slugify(String(text ?? ""), { lower: true, strict: true, trim: true });
}

/** Append -2, -3, … until slug is free (optionally ignoring one product id on update). */
export async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = createSlug(base) || "product";
  let slug = root;
  let counter = 1;

  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || (excludeId && existing.id === excludeId)) return slug;
    slug = `${root}-${counter}`;
    counter += 1;
  }
}
