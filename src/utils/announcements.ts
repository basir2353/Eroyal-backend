export type AnnouncementMessage = {
  id: string;
  text: string;
  isActive: boolean;
  sortOrder: number;
};

export function normalizeAnnouncementMessages(raw: unknown): AnnouncementMessage[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item, index) => {
      if (typeof item === "string") {
        const text = item.trim();
        if (!text) return null;
        return {
          id: `msg-${index}-${text.slice(0, 12).replace(/\s+/g, "-").toLowerCase()}`,
          text,
          isActive: true,
          sortOrder: index,
        };
      }

      if (item && typeof item === "object") {
        const row = item as Record<string, unknown>;
        const text = String(row.text ?? "").trim();
        if (!text) return null;
        return {
          id: String(row.id ?? `msg-${index}`),
          text,
          isActive: row.isActive !== false,
          sortOrder: Number(row.sortOrder ?? index),
        };
      }

      return null;
    })
    .filter((item): item is AnnouncementMessage => item !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({ ...item, sortOrder: index }));
}

export function mapWebsiteForPublic(row: Record<string, unknown>) {
  const messages = normalizeAnnouncementMessages(row.announcementMessages);

  return {
    siteName: row.siteName,
    logo: row.logo,
    favicon: row.favicon,
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
    whatsapp: row.whatsapp,
    address: row.address,
    footerContent: row.footerContent,
    copyrightText: row.copyrightText,
    socialLinks: row.socialLinks,
    announcementBarEnabled: row.announcementBarEnabled !== false,
    announcementMessages: messages.filter((item) => item.isActive).map((item) => item.text),
  };
}

export function mapWebsiteForAdmin(row: Record<string, unknown>) {
  return {
    ...row,
    announcementBarEnabled: row.announcementBarEnabled !== false,
    announcementMessages: normalizeAnnouncementMessages(row.announcementMessages),
  };
}
