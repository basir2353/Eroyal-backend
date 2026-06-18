import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { toContentStatus } from "../utils/serialize.js";

function normalizeFeaturedImage(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const str = String(value).trim();
  if (!str) return null;

  if (/^https?:\/\//i.test(str)) {
    try {
      const parsed = new URL(str);
      if (parsed.pathname.startsWith("/uploads/") || parsed.pathname.startsWith("/images/")) {
        return parsed.pathname;
      }
      return str;
    } catch {
      return str;
    }
  }

  return str;
}

function contentWhere(query: Record<string, unknown>, searchField = "title"): Prisma.BlogWhereInput {
  const where: Prisma.BlogWhereInput = {};
  if (query.status) where.status = toContentStatus(String(query.status));
  if (query.search) {
    where[searchField as "title"] = { contains: String(query.search), mode: "insensitive" };
  }
  return where;
}

function mapBlogInput(data: Record<string, unknown>) {
  const status = data.status ? toContentStatus(String(data.status)) : undefined;
  const categoryName = data.category
    ? String(data.category)
    : data.categoryName
      ? String(data.categoryName)
      : undefined;

  const mapped: Record<string, unknown> = {
    title: data.title != null ? String(data.title) : undefined,
    slug: data.slug != null ? String(data.slug) : undefined,
    excerpt: data.excerpt != null ? String(data.excerpt) : undefined,
    content: data.content != null ? String(data.content) : undefined,
    featuredImage:
      data.featuredImage !== undefined
        ? normalizeFeaturedImage(data.featuredImage)
        : undefined,
    author: data.author != null ? String(data.author) : undefined,
    authorEmail: data.authorEmail != null ? String(data.authorEmail) || null : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
    status,
    categoryName,
  };

  if (status === "PUBLISHED") {
    mapped.publishedAt = data.publishedAt ? new Date(String(data.publishedAt)) : new Date();
  } else if (status) {
    mapped.publishedAt = null;
  }

  return Object.fromEntries(
    Object.entries(mapped).filter(([key, value]) => value !== undefined && key !== "category"),
  );
}

export const blogRepository = {
  list(query: Record<string, unknown>, skip: number, limit: number) {
    const where = contentWhere(query);
    return Promise.all([
      prisma.blog.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.blog.count({ where }),
    ]);
  },

  findBySlug(slug: string, publishedOnly = false) {
    return prisma.blog.findFirst({
      where: { slug, ...(publishedOnly ? { status: "PUBLISHED" } : {}) },
    });
  },

  create(data: Record<string, unknown>) {
    return prisma.blog.create({
      data: mapBlogInput(data) as never,
    });
  },

  update(id: string, data: Record<string, unknown>) {
    return prisma.blog.update({ where: { id }, data: mapBlogInput(data) as never });
  },

  delete(id: string) {
    return prisma.blog.delete({ where: { id } });
  },

  countPublished() {
    return prisma.blog.count({ where: { status: "PUBLISHED" } });
  },

  latestPublished(limit = 5) {
    return prisma.blog.findMany({
      where: { status: "PUBLISHED" },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  },
};

export const faqRepository = {
  list(query: Record<string, unknown>, skip: number, limit: number) {
    const where: Prisma.FaqWhereInput = {};
    if (query.search) {
      where.question = { contains: String(query.search), mode: "insensitive" };
    }
    return Promise.all([
      prisma.faq.findMany({ where, skip, take: limit, orderBy: { sortOrder: "asc" } }),
      prisma.faq.count({ where }),
    ]);
  },

  listPublic() {
    return prisma.faq.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  },

  create(data: Record<string, unknown>) {
    return prisma.faq.create({ data: data as never });
  },

  update(id: string, data: Record<string, unknown>) {
    return prisma.faq.update({ where: { id }, data: data as never });
  },

  delete(id: string) {
    return prisma.faq.delete({ where: { id } });
  },
};

export const testimonialRepository = {
  list(query: Record<string, unknown>, skip: number, limit: number) {
    const where: Prisma.TestimonialWhereInput = {};
    if (query.status) where.status = toContentStatus(String(query.status));
    return Promise.all([
      prisma.testimonial.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.testimonial.count({ where }),
    ]);
  },

  listPublic() {
    return prisma.testimonial.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
    });
  },

  create(data: Record<string, unknown>) {
    return prisma.testimonial.create({
      data: {
        ...data,
        status: data.status ? toContentStatus(String(data.status)) : undefined,
      } as never,
    });
  },

  update(id: string, data: Record<string, unknown>) {
    const mapped = { ...data };
    if (mapped.status) mapped.status = toContentStatus(String(mapped.status));
    return prisma.testimonial.update({ where: { id }, data: mapped as never });
  },

  delete(id: string) {
    return prisma.testimonial.delete({ where: { id } });
  },

  countPublished() {
    return prisma.testimonial.count({ where: { status: "PUBLISHED" } });
  },
};

export const contactRepository = {
  list(skip: number, limit: number) {
    return Promise.all([
      prisma.contactMessage.findMany({ skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.contactMessage.count(),
    ]);
  },

  create(data: Record<string, unknown>) {
    return prisma.contactMessage.create({ data: data as never });
  },

  update(id: string, data: Record<string, unknown>) {
    return prisma.contactMessage.update({ where: { id }, data: data as never });
  },
};

export const categoryRepository = {
  list() {
    return prisma.category.findMany({ orderBy: { name: "asc" } });
  },

  create(data: Record<string, unknown>) {
    return prisma.category.create({ data: data as never });
  },

  update(id: string, data: Record<string, unknown>) {
    return prisma.category.update({ where: { id }, data: data as never });
  },

  delete(id: string) {
    return prisma.category.delete({ where: { id } });
  },
};

export const mediaRepository = {
  list(query: Record<string, unknown>, skip: number, limit: number) {
    const where: Prisma.MediaLibraryWhereInput = {};
    if (query.type) where.fileType = { startsWith: String(query.type) };
    if (query.search) {
      where.fileName = { contains: String(query.search), mode: "insensitive" };
    }
    return Promise.all([
      prisma.mediaLibrary.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.mediaLibrary.count({ where }),
    ]);
  },

  create(data: Record<string, unknown>) {
    return prisma.mediaLibrary.create({ data: data as never });
  },

  delete(id: string) {
    return prisma.mediaLibrary.delete({ where: { id } });
  },
};
