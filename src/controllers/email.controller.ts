import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import {
  getEmailStatus,
  sendTestEmail,
  verifyEmailTransport,
} from "../services/email.service.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { logger } from "../utils/logger.js";

export async function getEmailConfigStatus(_req: AuthRequest, res: Response) {
  const status = await getEmailStatus();
  return sendSuccess(res, status);
}

export async function testEmailDelivery(req: AuthRequest, res: Response) {
  const to = String(req.body?.to ?? req.user?.email ?? "").trim().toLowerCase();

  if (!to) {
    return sendError(res, "Recipient email is required (body.to or logged-in user email)", 400);
  }

  try {
    await verifyEmailTransport();
    const info = await sendTestEmail(to);

    logger.info("Test email delivered", { to, messageId: info.messageId });

    return sendSuccess(
      res,
      {
        sent: true,
        to,
        messageId: info.messageId,
      },
      "Test order confirmation email sent successfully",
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send test email";
    logger.error("Test email failed", { to, error: message });
    return sendError(res, message, 400);
  }
}
