import { env } from "../config/env.js";

const API_PUBLIC = process.env.API_PUBLIC_URL ?? `http://localhost:${env.port}`;

/** Local catalog filenames from seed → working URLs when frontend files are missing. */
export const CATALOG_IMAGE_FALLBACKS: Record<string, string> = {
  "chaunsa-premium-variety.png": `${API_PUBLIC}/uploads/1780742200437-n41qgsv7.jpg`,
  "chaunsa-mango-premium.png": `${API_PUBLIC}/uploads/1780741894140-a9h0rily.jpg`,
  "dasheri-mango.png": `${API_PUBLIC}/uploads/1780742267426-baq6vf5e.jpg`,
  "anwar-ratol-mango.png": `${API_PUBLIC}/uploads/1780742351702-njl6fete.jpg`,
  "chaunsa-hand-picked.png": `${API_PUBLIC}/uploads/1780741699476-8y84i6t7.jpg`,
  "e-royal-mango-logo.png": `${API_PUBLIC}/uploads/1780741146828-gakeeltz.png`,
};

export function resolveAssetUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;

  if (url.startsWith("/uploads/")) {
    return `${API_PUBLIC}${url}`;
  }

  if (url.startsWith("/images/")) {
    const file = url.split("/").pop() ?? "";
    if (CATALOG_IMAGE_FALLBACKS[file]) return CATALOG_IMAGE_FALLBACKS[file];
    return `${env.frontendUrl}${url}`;
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
