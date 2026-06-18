import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import {
  blogRepository,
  faqRepository,
  testimonialRepository,
} from "../repositories/content.repository.js";
import { getPagination, sendError, sendSuccess } from "../utils/apiResponse.js";
import { paramId } from "../utils/params.js";
import { createSlug } from "../utils/slug.js";
import { fromContentStatus, serialize, serializeMany } from "../utils/serialize.js";
import { resolveBlogAssetUrl } from "../utils/assets.js";

function mapBlog(doc: Record<string, unknown>) {
  if (doc.status) doc.status = fromContentStatus(String(doc.status));
  if (doc.categoryName) doc.category = doc.categoryName;
  if (doc.featuredImage != null && String(doc.featuredImage).trim()) {
    doc.featuredImage = resolveBlogAssetUrl(String(doc.featuredImage));
  }
  return doc;
}

function mapTestimonial(doc: Record<string, unknown>) {
  if (doc.status) doc.status = fromContentStatus(String(doc.status));
  return doc;
}

// Blogs
export async function listBlogs(req: AuthRequest, res: Response) {
  const { page, limit, skip } = getPagination(req.query);
  const [items, total] = await blogRepository.list(req.query, skip, limit);
  return sendSuccess(res, {
    items: serializeMany(items).map((b) => mapBlog(b as Record<string, unknown>)),
    pagination: { page, limit, total },
  });
}

function buildBlogPayload(body: Record<string, unknown>, slug?: string) {
  return {
    title: body.title,
    slug: slug ?? body.slug,
    excerpt: body.excerpt,
    content: body.content,
    featuredImage: body.featuredImage,
    category: body.category,
    categoryName: body.categoryName,
    author: body.author,
    authorEmail: body.authorEmail,
    status: body.status,
    tags: body.tags,
    publishedAt: body.publishedAt,
  };
}

export async function createBlog(req: AuthRequest, res: Response) {
  try {
    const title = String(req.body.title ?? "").trim();
    if (!title) return sendError(res, "Title is required", 400);

    const slug = String(req.body.slug ?? "").trim() || createSlug(title);
    const existing = await blogRepository.findBySlug(slug);
    if (existing) {
      return sendError(res, "A blog post with this URL slug already exists", 409);
    }

    const doc = await blogRepository.create(buildBlogPayload(req.body, slug));
    return sendSuccess(res, mapBlog(serialize(doc) as Record<string, unknown>), "Created", 201);
  } catch (error) {
    console.error("createBlog failed:", error);
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint") &&
      error.message.includes("slug")
    ) {
      return sendError(res, "A blog post with this URL slug already exists", 409);
    }
    const message =
      error instanceof Error && error.message.includes("Invalid")
        ? "Could not save blog post. Please check all fields and try again."
        : error instanceof Error
          ? error.message
          : "Could not create blog post";
    return sendError(res, message, 500);
  }
}

export async function updateBlog(req: AuthRequest, res: Response) {
  try {
    const doc = await blogRepository.update(paramId(req.params.id), buildBlogPayload(req.body));
    return sendSuccess(res, mapBlog(serialize(doc) as Record<string, unknown>));
  } catch (error) {
    console.error("updateBlog failed:", error);
    return sendError(res, "Not found", 404);
  }
}

export async function deleteBlog(req: AuthRequest, res: Response) {
  await blogRepository.delete(paramId(req.params.id));
  return sendSuccess(res, null, "Deleted");
}

export async function listPublicBlogs(req: AuthRequest, res: Response) {
  const { page, limit, skip } = getPagination(req.query);
  const [items, total] = await blogRepository.list({ status: "published", ...req.query }, skip, limit);
  return sendSuccess(res, {
    items: serializeMany(items).map((b) => mapBlog(b as Record<string, unknown>)),
    pagination: { page, limit, total },
  });
}

export async function getPublicBlog(req: AuthRequest, res: Response) {
  const blog = await blogRepository.findBySlug(paramId(req.params.slug), true);
  if (!blog) return sendError(res, "Not found", 404);
  return sendSuccess(res, mapBlog(serialize(blog) as Record<string, unknown>));
}

// FAQ
export async function listFaq(req: AuthRequest, res: Response) {
  const { page, limit, skip } = getPagination(req.query);
  const [items, total] = await faqRepository.list(req.query, skip, limit);
  return sendSuccess(res, { items: serializeMany(items), pagination: { page, limit, total } });
}

export async function createFaq(req: AuthRequest, res: Response) {
  const doc = await faqRepository.create(req.body);
  return sendSuccess(res, serialize(doc), "Created", 201);
}

export async function updateFaq(req: AuthRequest, res: Response) {
  try {
    const doc = await faqRepository.update(paramId(req.params.id), req.body);
    return sendSuccess(res, serialize(doc));
  } catch {
    return sendError(res, "Not found", 404);
  }
}

export async function deleteFaq(req: AuthRequest, res: Response) {
  await faqRepository.delete(paramId(req.params.id));
  return sendSuccess(res, null, "Deleted");
}

export async function listPublicFaq(_req: AuthRequest, res: Response) {
  return sendSuccess(res, serializeMany(await faqRepository.listPublic()));
}

// Testimonials
export async function listTestimonials(req: AuthRequest, res: Response) {
  const { page, limit, skip } = getPagination(req.query);
  const [items, total] = await testimonialRepository.list(req.query, skip, limit);
  return sendSuccess(res, {
    items: serializeMany(items).map((t) => mapTestimonial(t as Record<string, unknown>)),
    pagination: { page, limit, total },
  });
}

export async function createTestimonial(req: AuthRequest, res: Response) {
  const doc = await testimonialRepository.create(req.body);
  return sendSuccess(
    res,
    mapTestimonial(serialize(doc) as Record<string, unknown>),
    "Created",
    201,
  );
}

export async function updateTestimonial(req: AuthRequest, res: Response) {
  try {
    const doc = await testimonialRepository.update(paramId(req.params.id), req.body);
    return sendSuccess(res, mapTestimonial(serialize(doc) as Record<string, unknown>));
  } catch {
    return sendError(res, "Not found", 404);
  }
}

export async function deleteTestimonial(req: AuthRequest, res: Response) {
  await testimonialRepository.delete(paramId(req.params.id));
  return sendSuccess(res, null, "Deleted");
}

export async function listPublicTestimonials(_req: AuthRequest, res: Response) {
  return sendSuccess(
    res,
    serializeMany(await testimonialRepository.listPublic()).map((t) =>
      mapTestimonial(t as Record<string, unknown>),
    ),
  );
}
