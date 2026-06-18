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

export async function deleteMedia(req: AuthRequest, res: Response) {
  await mediaRepository.delete(paramId(req.params.id));
  return sendSuccess(res, null, "Deleted");
}
