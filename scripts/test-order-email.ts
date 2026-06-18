/**
 * Send a test order confirmation email using current EMAIL_* / SMTP settings.
 *
 * Usage:
 *   npm run test:order-email --workspace=backend
 *   npm run test:order-email --workspace=backend -- you@example.com
 */
import { sendTestEmail, verifyEmailTransport } from "../src/services/email.service.js";
import { logger } from "../src/utils/logger.js";

const recipient = process.argv[2];

async function main() {
  if (!recipient) {
    throw new Error("Usage: npm run test:order-email -- you@gmail.com");
  }

  await verifyEmailTransport();
  const info = await sendTestEmail(recipient);

  logger.info("Test order confirmation email sent", {
    recipient,
    messageId: info.messageId,
  });
}

main().catch((error) => {
  logger.error("Test order confirmation email failed", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
