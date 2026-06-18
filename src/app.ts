import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { UPLOADS_DIR } from "./config/paths.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";
import { getEmailStatus } from "./services/email.service.js";

export function createApp() {
  const app = express();

  app.use(
    helmet({
      // Allow storefront/admin (other origins) to load /uploads images
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    cors({
      origin:
        env.nodeEnv === "production"
          ? [env.frontendUrl, env.adminUrl]
          : true,
      credentials: true,
    }),
  );
  app.use(morgan("dev"));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "e-royal-mango-api" });
  });

  app.get("/health/email", async (_req, res) => {
    const status = await getEmailStatus();
    res.json({ status: status.verified ? "ok" : "degraded", email: status });
  });

  app.use("/uploads", express.static(UPLOADS_DIR));

  app.use("/api", routes);
  app.use(errorHandler);

  return app;
}
