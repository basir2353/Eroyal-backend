import { env } from "../config/env.js";

const API_PUBLIC = process.env.API_PUBLIC_URL ?? `http://localhost:${env.port}`;

/** Local catalog filenames → storefront /public/images paths. */
export const CATALOG_IMAGE_FALLBACKS: Record<string, string> = {
  "chaunsa-premium-variety.png": "/images/chaunsa-premium-variety.jpg",
  "chaunsa-premium-variety.jpg": "/images/chaunsa-premium-variety.jpg",
  "chaunsa-mango-premium.png": "/images/chaunsa-mango-premium.jpg",
  "chaunsa-mango-premium.jpg": "/images/chaunsa-mango-premium.jpg",
  "dasheri-mango.png": "/images/dasheri-mango.jpg",
  "dasheri-mango.jpg": "/images/dasheri-mango.jpg",
  "anwar-ratol-mango.png": "/images/anwar-ratol-mango.jpg",
  "anwar-ratol-mango.jpg": "/images/anwar-ratol-mango.jpg",
  "chaunsa-hand-picked.png": "/images/chaunsa-hand-picked.jpg",
  "chaunsa-hand-picked.jpg": "/images/chaunsa-hand-picked.jpg",
  "e-royal-mango-logo.png": "/images/e-royal-mango-logo.png",
};

export function resolveAssetUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;

  if (url.startsWith("/uploads/")) {
    return `${API_PUBLIC}${url}`;
  }

  if (url.startsWith("/images/")) {
    const file = url.split("/").pop() ?? "";
    const catalogPath = CATALOG_IMAGE_FALLBACKS[file] ?? url;
    return `${env.frontendUrl}${catalogPath}`;
  }

  if (url.startsWith("/")) {
    return `${env.frontendUrl}${url}`;
  }

  return url;
}

/** Blog images: exact stored path — never swap catalog filenames. */
export function resolveBlogAssetUrl(url: string | null | undefined): string {
  if (!url?.trim()) return "";

  const trimmed = url.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.startsWith("/uploads/")) {
        return `${API_PUBLIC}${parsed.pathname}`;
      }
      if (parsed.pathname.startsWith("/images/")) {
        return parsed.pathname;
      }
    } catch {
      /* keep full URL */
    }
    return trimmed;
  }

  if (trimmed.startsWith("/uploads/")) return `${API_PUBLIC}${trimmed}`;
  if (trimmed.startsWith("/images/")) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;

  return trimmed;
}
