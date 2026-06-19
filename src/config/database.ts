import { prisma } from "../lib/prisma.js";

export async function connectDatabase(): Promise<void> {
  const timeoutMs = process.env.NODE_ENV === "production" ? 30_000 : 15_000;
  await Promise.race([
    prisma.$connect(),
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `Database connection timed out after ${timeoutMs / 1000}s. Check DATABASE_URL in backend/.env`,
            ),
          ),
        timeoutMs,
      ),
    ),
  ]);
  console.log("PostgreSQL connected via Prisma");
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
