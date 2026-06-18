import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { getEmailStatus } from "./services/email.service.js";
import { logger } from "./utils/logger.js";

async function bootstrap() {
  await connectDatabase();

  const emailStatus = await getEmailStatus();
  if (!emailStatus.verified) {
    logger.warn("Order confirmation email is not ready", {
      error: emailStatus.error,
      host: emailStatus.host,
      user: emailStatus.user,
    });
  } else {
    logger.info("Order confirmation email is ready", {
      host: emailStatus.host,
      from: emailStatus.from,
    });
  }

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`API running on http://localhost:${env.port}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
