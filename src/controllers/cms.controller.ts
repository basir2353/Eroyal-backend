import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { CMS_SECTION_KEYS, cmsRepository, type CmsSectionKey } from "../repositories/cms.repository.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

export async function getCmsSection(req: AuthRequest, res: Response) {
  const key = req.params.section as CmsSectionKey;
  if (!(key in CMS_SECTION_KEYS)) return sendError(res, "Invalid CMS section", 404);
  const section = await cmsRepository.getByKey(key);
  const type = CMS_SECTION_KEYS[key];
  return sendSuccess(res, cmsRepository.toApiSection(section, type));
}

export async function updateCmsSection(req: AuthRequest, res: Response) {
  const key = req.params.section as CmsSectionKey;
  if (!(key in CMS_SECTION_KEYS)) return sendError(res, "Invalid CMS section", 404);
  const section = await cmsRepository.updateByKey(key, req.body);
  const type = CMS_SECTION_KEYS[key];
  return sendSuccess(res, cmsRepository.toApiSection(section, type), "CMS section updated");
}

export async function getPublicCms(_req: AuthRequest, res: Response) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  const [cms, about, contactPage] = await Promise.all([
    cmsRepository.getAllPublic(),
    cmsRepository.getPageSection("ABOUT"),
    cmsRepository.getPageSection("CONTACT_PAGE"),
  ]);
  return sendSuccess(res, { ...cms, about, contactPage });
}

export async function getPublicAbout(_req: AuthRequest, res: Response) {
  return sendSuccess(res, await cmsRepository.getPageSection("ABOUT"));
}
