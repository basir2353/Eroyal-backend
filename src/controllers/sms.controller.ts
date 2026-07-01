import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { settingsRepository } from "../repositories/settings.repository.js";
import { getSmsStatus, sendTestOrderSms } from "../services/sms.service.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { logger } from "../utils/logger.js";
import { serialize } from "../utils/serialize.js";

export async function getSmsSettings(_req: AuthRequest, res: Response) {
  const settings = serialize(await settingsRepository.getSms());
  const smsStatus = await getSmsStatus();
  return sendSuccess(res, { ...settings, smsStatus });
}

export async function updateSmsSettings(req: AuthRequest, res: Response) {
  const doc = await settingsRepository.updateSms(req.body);
  const smsStatus = await getSmsStatus();
  return sendSuccess(
    res,
    { ...serialize(doc), smsStatus },
    "SMS settings updated",
  );
}

export async function getSmsConfigStatus(_req: AuthRequest, res: Response) {
  return sendSuccess(res, await getSmsStatus());
}

export async function testSmsDelivery(req: AuthRequest, res: Response) {
  const to = String(req.body?.to ?? "").trim();
  if (!to) return sendError(res, "Recipient phone number is required (body.to)", 400);

  try {
    const info = await sendTestOrderSms(to);
    logger.info("Test SMS/WhatsApp delivered", { to, sid: info.sid });
    return sendSuccess(
      res,
      { sent: true, to, messageId: info.sid },
      "Test order message sent successfully",
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send test message";
    logger.error("Test SMS failed", { to, error: message });
    return sendError(res, message, 400);
  }
}
