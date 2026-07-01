import fs from "fs/promises";
import path from "path";
import type { Response } from "express";
import { UPLOADS_DIR } from "../config/paths.js";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { env } from "../config/env.js";
import type { AuthRequest } from "../middleware/auth.js";
import { mediaRepository } from "../repositories/content.repository.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { paramId } from "../utils/params.js";
import { serialize } from "../utils/serialize.js";

if (env.cloudinary.cloudName) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function uploadPublicBaseUrl() {
  return process.env.API_PUBLIC_URL ?? `http://localhost:${env.port}`;
}

async function saveLocalUpload(file: Express.Multer.File) {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const ext = path.extname(file.originalname) || ".jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  await fs.writeFile(path.join(UPLOADS_DIR, filename), file.buffer);
  return {
    url: `${uploadPublicBaseUrl()}/uploads/${filename}`,
    publicId: `local-${filename}`,
  };
}

async function saveLocalBuffer(buffer: Buffer, ext: string, fileName: string) {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const safeExt = ext.startsWith(".") ? ext : `.${ext}`;
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`;
  await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer);
  return {
    url: `${uploadPublicBaseUrl()}/uploads/${filename}`,
    publicId: `local-${filename}`,
    fileName,
    mimeType: mimeFromExtension(safeExt),
    size: buffer.length,
  };
}

function mimeFromExtension(ext: string) {
  switch (ext.toLowerCase()) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".avif":
      return "image/avif";
    default:
      return "image/jpeg";
  }
}

function resolveDirectImageUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);

    const driveMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
    if (parsed.hostname.includes("drive.google.com") && driveMatch?.[1]) {
      return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
    }

    if (parsed.hostname.includes("dropbox.com")) {
      parsed.searchParams.set("dl", "1");
      parsed.hostname = parsed.hostname.replace("www.dropbox.com", "dl.dropboxusercontent.com");
      return parsed.toString();
    }

    if (parsed.hostname === "imgur.com" && parsed.pathname.length > 1) {
      const id = parsed.pathname.replace(/^\//, "").split("/")[0];
      if (id && !id.includes(".")) {
        return `https://i.imgur.com/${id}.jpg`;
      }
    }

    if (parsed.hostname === "ibb.co" && parsed.pathname.length > 1) {
      return rawUrl;
    }

    if (parsed.hostname.includes("postimg.cc") && parsed.pathname.startsWith("/")) {
      return rawUrl;
    }
  } catch {
    /* keep original */
  }

  return rawUrl;
}

function resolveAbsoluteUrl(baseUrl: string, relativeUrl: string): string {
  try {
    return new URL(relativeUrl, baseUrl).toString();
  } catch {
    return relativeUrl;
  }
}

function extractImageUrlFromHtml(html: string, baseUrl: string): string | null {
  const metaPatterns = [
    /<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
    /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
  ];

  for (const pattern of metaPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return resolveAbsoluteUrl(baseUrl, match[1].trim());
    }
  }

  const embedded = html.match(/https?:\/\/i\.ibb\.co\/[^\s"'<>]+/i);
  if (embedded?.[0]) return embedded[0];

  const imgurDirect = html.match(/https?:\/\/i\.imgur\.com\/[^\s"'<>]+/i);
  if (imgurDirect?.[0]) return imgurDirect[0];

  return null;
}

async function downloadRemoteImage(
  targetUrl: string,
  signal: AbortSignal,
): Promise<{ buffer: Buffer; contentType: string; finalUrl: string }> {
  let referer = "";
  try {
    referer = new URL(targetUrl).origin + "/";
  } catch {
    /* ignore */
  }

  const response = await fetch(targetUrl, {
    signal,
    redirect: "follow",
    headers: {
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      ...(referer ? { Referer: referer } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const buffer = Buffer.from(await response.arrayBuffer());
  return { buffer, contentType, finalUrl: response.url || targetUrl };
}

function detectImageFromBuffer(buffer: Buffer): { mimeType: string; ext: string } | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { mimeType: "image/png", ext: ".png" };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: "image/jpeg", ext: ".jpg" };
  }
  if (buffer.slice(0, 3).toString("ascii") === "GIF") {
    return { mimeType: "image/gif", ext: ".gif" };
  }
  if (
    buffer.slice(0, 4).toString("ascii") === "RIFF" &&
    buffer.slice(8, 12).toString("ascii") === "WEBP"
  ) {
    return { mimeType: "image/webp", ext: ".webp" };
  }
  if (buffer.slice(4, 12).toString("ascii").includes("avif")) {
    return { mimeType: "image/avif", ext: ".avif" };
  }

  const start = buffer.slice(0, 512).toString("utf8").trimStart();
  if (start.startsWith("<svg") || (start.startsWith("<?xml") && start.includes("<svg"))) {
    return { mimeType: "image/svg+xml", ext: ".svg" };
  }

  return null;
}

function looksLikeHtml(buffer: Buffer): boolean {
  const start = buffer.slice(0, 256).toString("utf8").trimStart().toLowerCase();
  return start.startsWith("<!doctype html") || start.startsWith("<html") || start.startsWith("<head");
}

function extractUploadPath(url: string): string | null {
  if (url.startsWith("/uploads/")) return url.split("?")[0] ?? url;
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/uploads/")) {
      return parsed.pathname.split("?")[0] ?? parsed.pathname;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function listMedia(req: AuthRequest, res: Response) {
  const { getPagination } = await import("../utils/apiResponse.js");
  const { page, limit, skip } = getPagination(req.query);
  const [items, total] = await mediaRepository.list(req.query, skip, limit);
  const { serializeMany } = await import("../utils/serialize.js");
  return sendSuccess(res, {
    items: serializeMany(items),
    pagination: { page, limit, total },
  });
}

export async function uploadMedia(req: AuthRequest, res: Response) {
  if (!req.file) return sendError(res, "No file uploaded");

  let url = "";
  let publicId = "";

  if (env.cloudinary.cloudName) {
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "e-royal-mango" },
        (err, result) => (err || !result ? reject(err) : resolve(result)),
      );
      stream.end(req.file!.buffer);
    });
    url = result.secure_url;
    publicId = result.public_id;
  } else {
    const saved = await saveLocalUpload(req.file);
    url = saved.url;
    publicId = saved.publicId;
  }

  const media = await mediaRepository.create({
    url,
    publicId,
    fileName: req.file.originalname,
    fileType: req.file.mimetype.split("/")[0],
    mimeType: req.file.mimetype,
    size: req.file.size,
    uploadedById: req.user!.id,
  });

  return sendSuccess(res, serialize(media), "File uploaded", 201);
}

export async function createMediaUrl(req: AuthRequest, res: Response) {
  const media = await mediaRepository.create({
    ...req.body,
    mimeType: req.body.mimeType ?? req.body.fileType ?? "image/jpeg",
    uploadedById: req.user!.id,
  });
  return sendSuccess(res, serialize(media), "Media saved", 201);
}

export async function importMediaFromUrl(req: AuthRequest, res: Response) {
  const rawUrl = String(req.body?.url ?? "").trim();
  if (!rawUrl) return sendError(res, "Image URL is required");

  const existingUpload = extractUploadPath(rawUrl);
  if (existingUpload) {
    return sendSuccess(res, { url: existingUpload }, "Image URL ready");
  }

  if (rawUrl.startsWith("/images/")) {
    return sendSuccess(res, { url: rawUrl.split("?")[0] ?? rawUrl }, "Image URL ready");
  }

  let targetUrl = resolveDirectImageUrl(rawUrl);
  if (!/^https?:\/\//i.test(targetUrl)) {
    return sendError(res, "Enter a full image URL starting with http:// or https://");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const queue = [targetUrl];
    const visited = new Set<string>();
    let buffer: Buffer | null = null;
    let resolvedUrl = targetUrl;
    let detected: { mimeType: string; ext: string } | null = null;

    while (queue.length > 0 && visited.size < 4) {
      const currentUrl = queue.shift()!;
      if (visited.has(currentUrl)) continue;
      visited.add(currentUrl);

      let downloaded;
      try {
        downloaded = await downloadRemoteImage(currentUrl, controller.signal);
      } catch {
        if (visited.size === 1 && queue.length === 0) {
          /* fall through to external URL or error */
        }
        continue;
      }

      buffer = downloaded.buffer;
      resolvedUrl = downloaded.finalUrl;

      if (!buffer.length) {
        if (visited.size === 1) return sendError(res, "Downloaded image is empty.");
        continue;
      }
      if (buffer.length > 10 * 1024 * 1024) {
        return sendError(res, "Image exceeds 10MB limit.");
      }

      detected = detectImageFromBuffer(buffer);
      if (detected) break;

      if (looksLikeHtml(buffer)) {
        const extracted = extractImageUrlFromHtml(buffer.toString("utf8"), resolvedUrl);
        if (extracted && !visited.has(extracted)) {
          queue.push(extracted);
        }
      }
    }

    if (!detected || !buffer) {
      return sendSuccess(res, { url: rawUrl }, "External image URL ready");
    }

    const ext = detected.ext;
    let fileName = `imported-banner${ext}`;
    try {
      const base = path.basename(new URL(resolvedUrl).pathname);
      fileName = base && base !== "/" ? base : fileName;
    } catch {
      /* keep default */
    }

    let url = "";
    let publicId = "";
    let mimeType = detected.mimeType;
    let size = buffer.length;

    if (env.cloudinary.cloudName) {
      const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "e-royal-mango", resource_type: "image" },
          (err, result) => (err || !result ? reject(err) : resolve(result)),
        );
        stream.end(buffer);
      });
      url = result.secure_url;
      publicId = result.public_id;
    } else {
      const saved = await saveLocalBuffer(buffer, ext, fileName);
      url = saved.url;
      publicId = saved.publicId;
      mimeType = saved.mimeType;
      size = saved.size;
    }

    const media = await mediaRepository.create({
      url,
      publicId,
      fileName,
      fileType: "image",
      mimeType,
      size,
      uploadedById: req.user!.id,
    });

    const storedUrl = extractUploadPath(url) ?? url;
    return sendSuccess(res, { ...serialize(media), url: storedUrl }, "Image imported from URL", 201);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return sendError(res, "Image download timed out. Try another URL or upload the file instead.");
    }
    return sendError(res, "Could not import image from URL.");
  } finally {
    clearTimeout(timeout);
  }
}

export async function deleteMedia(req: AuthRequest, res: Response) {
  await mediaRepository.delete(paramId(req.params.id));
  return sendSuccess(res, null, "Deleted");
}
