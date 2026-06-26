import { env } from "./env.js";

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function withWwwVariants(origin: string): string[] {
  const normalized = normalizeOrigin(origin);
  if (!normalized.startsWith("http")) return [normalized];

  try {
    const url = new URL(normalized);
    const host = url.hostname;
    const origins = new Set<string>([normalized]);

    if (host.startsWith("www.")) {
      url.hostname = host.slice(4);
      origins.add(url.origin);
    } else if (!host.includes("localhost") && host.includes(".")) {
      url.hostname = `www.${host}`;
      origins.add(url.origin);
    }

    return [...origins];
  } catch {
    return [normalized];
  }
}

/** Allowed browser origins for CORS (storefront, admin, custom domains). */
export function getCorsOrigins(): string[] {
  const fromEnv = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

  const defaults = [
    ...withWwwVariants(env.frontendUrl),
    ...withWwwVariants(env.adminUrl),
    "https://eroyalmango.com",
    "https://www.eroyalmango.com",
    "https://admin.eroyalmango.com",
    "https://eroyalmango.vercel.app",
    "https://eroyal-admin.vercel.app",
  ];

  return [...new Set([...fromEnv, ...defaults.map(normalizeOrigin)])];
}

export function isCorsOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  const allowed = getCorsOrigins();
  return allowed.includes(normalizeOrigin(origin));
}
