import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { toProductStatus } from "../utils/serialize.js";
import { normalizeOfferInput, applyOfferToWeightOptions } from "../utils/productOffer.js";

async function resolveCategoryId(categoryId: string): Promise<string> {
  const id = String(categoryId).trim();
  if (!id) throw new Error("Category is required");

  const category = await prisma.category.findUnique({ where: { id }, select: { id: true } });
  if (!category) {
    throw new Error("Invalid category selected");
  }
  return id;
}

function buildWhere(query: Record<string, unknown>): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};
  if (query.status) where.status = toProductStatus(String(query.status));
  if (query.category) where.categoryId = String(query.category);
  if (query.search) {
    where.OR = [
      { name: { contains: String(query.search), mode: "insensitive" } },
      { slug: { contains: String(query.search), mode: "insensitive" } },
    ];
  }
  if (query.featured === "true" || query.featured === true) where.featured = true;
  if (query.mostLoved === "true" || query.mostLoved === true) where.mostLoved = true;
  return where;
}

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { sortOrder: "asc" as const } },
  seo: true,
};

export const productRepository = {
  async list(query: Record<string, unknown>, skip: number, limit: number, sort = "desc") {
    const where = buildWhere(query);
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: { createdAt: sort.startsWith("-") ? "desc" : "asc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);
    return { items, total };
  },

  findBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: productInclude,
    });
  },

  findById(id: string) {
    return prisma.product.findUnique({ where: { id }, include: productInclude });
  },

  async create(data: Record<string, unknown>) {
    const { images, seo, isFeatured, isMostLoved, description, fullDescription, category, ...rest } = data;
    const imageUrls = Array.isArray(images) ? (images as string[]) : [];
    const categoryId = await resolveCategoryId(String(rest.categoryId ?? category));
    const offer = normalizeOfferInput(rest);
    const regularPrice = Number(rest.regularPrice);
    const weightOptions = applyOfferToWeightOptions(rest.weightOptions, offer.onSale);
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: String(rest.name),
          slug: String(rest.slug),
          shortDescription: String(rest.shortDescription ?? ""),
          fullDescription: String(fullDescription ?? description ?? ""),
          stock: Number(rest.stock ?? 0),
          regularPrice,
          salePrice: offer.salePrice,
          featured: Boolean(isFeatured ?? rest.featured),
          mostLoved: Boolean(isMostLoved ?? rest.mostLoved),
          onSale: offer.onSale,
          saleBadge: offer.saleBadge,
          discountPercent: offer.discountPercent,
          offerStartDate: offer.offerStartDate,
          offerEndDate: offer.offerEndDate,
          weightOptions: weightOptions as Prisma.InputJsonValue,
          categoryId,
          status: rest.status ? toProductStatus(String(rest.status)) : undefined,
        },
        include: productInclude,
      });

      if (imageUrls.length) {
        await tx.productImage.createMany({
          data: imageUrls.map((url, i) => ({
            productId: product.id,
            url,
            sortOrder: i,
            isPrimary: i === 0,
          })),
        });
      }

      if (seo && typeof seo === "object") {
        await tx.seoSetting.create({
          data: { ...(seo as object), productId: product.id, page: "product" },
        });
      }

      return tx.product.findUnique({ where: { id: product.id }, include: productInclude });
    });
  },

  async update(id: string, data: Record<string, unknown>) {
    const { images, seo, isFeatured, isMostLoved, category, slug, name, ...rest } = data;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return null;

    const categoryId =
      rest.categoryId || category
        ? await resolveCategoryId(String(rest.categoryId ?? category))
        : undefined;

    const offerFieldsTouched =
      rest.onSale !== undefined ||
      rest.salePrice !== undefined ||
      rest.saleBadge !== undefined ||
      rest.discountPercent !== undefined ||
      rest.offerStartDate !== undefined ||
      rest.offerEndDate !== undefined ||
      rest.regularPrice !== undefined;

    const mergedRegularPrice =
      rest.regularPrice !== undefined ? Number(rest.regularPrice) : Number(existing.regularPrice);

    const offer = offerFieldsTouched
      ? normalizeOfferInput({
          onSale: rest.onSale !== undefined ? rest.onSale : existing.onSale,
          regularPrice: mergedRegularPrice,
          salePrice:
            rest.salePrice !== undefined
              ? rest.salePrice
              : existing.salePrice != null
                ? Number(existing.salePrice)
                : null,
          saleBadge: rest.saleBadge !== undefined ? rest.saleBadge : existing.saleBadge,
          discountPercent:
            rest.discountPercent !== undefined
              ? rest.discountPercent
              : existing.discountPercent,
          offerStartDate:
            rest.offerStartDate !== undefined ? rest.offerStartDate : existing.offerStartDate,
          offerEndDate:
            rest.offerEndDate !== undefined ? rest.offerEndDate : existing.offerEndDate,
        })
      : null;

    const nextWeightOptions = offer
      ? applyOfferToWeightOptions(rest.weightOptions ?? existing.weightOptions, offer.onSale)
      : undefined;

    return prisma.$transaction(async (tx) => {
      const updateData: Prisma.ProductUpdateInput = {
        ...(name !== undefined ? { name: String(name) } : {}),
        ...(slug !== undefined ? { slug: String(slug) } : {}),
        ...(rest.shortDescription !== undefined
          ? { shortDescription: String(rest.shortDescription) }
          : {}),
        ...(rest.fullDescription !== undefined
          ? { fullDescription: String(rest.fullDescription) }
          : {}),
        ...(rest.stock !== undefined ? { stock: Number(rest.stock) } : {}),
        ...(rest.regularPrice !== undefined ? { regularPrice: Number(rest.regularPrice) } : {}),
        ...(offer
          ? {
              salePrice: offer.salePrice,
              onSale: offer.onSale,
              saleBadge: offer.saleBadge,
              discountPercent: offer.discountPercent,
              offerStartDate: offer.offerStartDate,
              offerEndDate: offer.offerEndDate,
              weightOptions: nextWeightOptions as Prisma.InputJsonValue,
            }
          : {}),
        ...(isFeatured !== undefined ? { featured: Boolean(isFeatured) } : {}),
        ...(isMostLoved !== undefined ? { mostLoved: Boolean(isMostLoved) } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(rest.status ? { status: toProductStatus(String(rest.status)) } : {}),
      };

      await tx.product.update({ where: { id }, data: updateData });

      if (Array.isArray(images)) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.productImage.createMany({
          data: (images as string[]).map((url, i) => ({
            productId: id,
            url,
            sortOrder: i,
            isPrimary: i === 0,
          })),
        });
      }

      if (seo && typeof seo === "object") {
        await tx.seoSetting.upsert({
          where: { productId: id },
          create: { ...(seo as object), productId: id, page: "product" },
          update: seo as never,
        });
      }

      return tx.product.findUnique({ where: { id }, include: productInclude });
    });
  },

  delete(id: string) {
    return prisma.product.delete({ where: { id } });
  },

  bulkAction(ids: string[], action: string) {
    if (action === "delete") {
      return prisma.product.deleteMany({ where: { id: { in: ids } } });
    }
    if (["published", "hidden", "draft"].includes(action)) {
      return prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { status: toProductStatus(action) },
      });
    }
    return null;
  },
};
