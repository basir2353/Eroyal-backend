import dotenv from "dotenv";

dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: required(
    "DATABASE_URL",
    "postgresql://postgres:postgres@127.0.0.1:5432/e_royal_mango?schema=public",
  ),
  jwtSecret: required("JWT_SECRET", "dev-only-jwt-secret-change-in-production"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  adminUrl: process.env.ADMIN_URL ?? "http://localhost:3001",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  },
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL ?? "admin@eroyalmango.com",
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? "Admin@123456",
  email: {
    host: process.env.EMAIL_HOST ?? process.env.SMTP_HOST ?? "",
    port: Number(process.env.EMAIL_PORT ?? process.env.SMTP_PORT ?? 587),
    user: process.env.EMAIL_USER ?? process.env.SMTP_USER ?? "",
    pass: process.env.EMAIL_PASS ?? process.env.SMTP_PASS ?? "",
    from: process.env.EMAIL_FROM ?? "noreply@eroyalmango.com",
    fromName: process.env.EMAIL_FROM_NAME ?? "E Royal Mango",
  },
};
