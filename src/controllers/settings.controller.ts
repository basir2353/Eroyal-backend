import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { env } from "../config/env.js";
import {
  mapCouponForApi,
  mapCouponInput,
  mapPaymentForApi,
  settingsRepository,
} from "../repositories/settings.repository.js";
import { getEmailStatus } from "../services/email.service.js";
import { prisma } from "../lib/prisma.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { paramId } from "../utils/params.js";
import { serialize, serializeMany } from "../utils/serialize.js";

export async function getWebsiteSettings(_req: AuthRequest, res: Response) {
  return sendSuccess(res, serialize(await settingsRepository.getWebsite()));
}

export async function updateWebsiteSettings(req: AuthRequest, res: Response) {
  const doc = await settingsRepository.updateWebsite(req.body);
  return sendSuccess(res, serialize(doc), "Website settings updated");
}

export async function getPaymentSettings(_req: AuthRequest, res: Response) {
  const doc = await settingsRepository.getPayment();
  return sendSuccess(res, mapPaymentForApi(serialize(doc) as Record<string, unknown>));
}

export async function updatePaymentSettings(req: AuthRequest, res: Response) {
  const doc = await settingsRepository.updatePayment(req.body);
  return sendSuccess(
    res,
    mapPaymentForApi(serialize(doc) as Record<string, unknown>),
    "Payment settings updated",
  );
}

export async function getShippingSettings(_req: AuthRequest, res: Response) {
  return sendSuccess(res, serialize(await settingsRepository.getShipping()));
}

export async function updateShippingSettings(req: AuthRequest, res: Response) {
  const doc = await settingsRepository.updateShipping(req.body);
  return sendSuccess(res, serialize(doc), "Shipping settings updated");
}

export async function getEmailSettings(_req: AuthRequest, res: Response) {
  const db = serialize(await settingsRepository.getEmail()) as Record<string, unknown>;
  const status = await getEmailStatus();

  return sendSuccess(res, {
    ...db,
    smtpHost: env.email.host || db.smtpHost,
    smtpPort: env.email.port || db.smtpPort,
    smtpUser: env.email.user || db.smtpUser,
    smtpPass: env.email.pass ? "********" : db.smtpPass ? "********" : "",
    senderEmail: env.email.from || db.senderEmail,
    senderName: env.email.fromName || db.senderName,
    usingEnvConfig: Boolean(env.email.host && env.email.user && env.email.pass),
    emailStatus: status,
  });
}

export async function updateEmailSettings(req: AuthRequest, res: Response) {
  const doc = await settingsRepository.updateEmail(req.body);
  return sendSuccess(res, serialize(doc), "Email settings updated");
}

export async function listSeo(_req: AuthRequest, res: Response) {
  return sendSuccess(res, serializeMany(await settingsRepository.listSeo()));
}

export async function upsertSeo(req: AuthRequest, res: Response) {
  const page = String(req.body.page);
  const slug = req.body.slug ? String(req.body.slug) : null;
  const existing = await prisma.seoSetting.findFirst({ where: { page, slug } });
  const doc = existing
    ? await prisma.seoSetting.update({ where: { id: existing.id }, data: req.body })
    : await prisma.seoSetting.create({ data: req.body });
  return sendSuccess(res, serialize(doc), "SEO updated");
}

export async function listCoupons(_req: AuthRequest, res: Response) {
  const coupons = await settingsRepository.listCoupons();
  return sendSuccess(
    res,
    serializeMany(coupons).map((c) => mapCouponForApi(c as Record<string, unknown>)),
  );
}

export async function createCoupon(req: AuthRequest, res: Response) {
  const coupon = await settingsRepository.createCoupon(mapCouponInput(req.body));
  return sendSuccess(
    res,
    mapCouponForApi(serialize(coupon) as Record<string, unknown>),
    "Coupon created",
    201,
  );
}

export async function updateCoupon(req: AuthRequest, res: Response) {
  const coupon = await settingsRepository.updateCoupon(
    paramId(req.params.id),
    mapCouponInput(req.body),
  );
  return sendSuccess(
    res,
    mapCouponForApi(serialize(coupon) as Record<string, unknown>),
    "Coupon updated",
  );
}

export async function deleteCoupon(req: AuthRequest, res: Response) {
  await settingsRepository.deleteCoupon(paramId(req.params.id));
  return sendSuccess(res, null, "Coupon deleted");
}

export async function getPublicSettings(_req: AuthRequest, res: Response) {
  const [website, payments, shipping] = await Promise.all([
    settingsRepository.getWebsite(),
    settingsRepository.getPayment(),
    settingsRepository.getShipping(),
  ]);
  return sendSuccess(res, {
    website: serialize(website),
    payments: mapPaymentForApi(serialize(payments) as Record<string, unknown>),
    shipping: serialize(shipping),
  });
}
