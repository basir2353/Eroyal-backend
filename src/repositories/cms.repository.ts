import type { HomepageSectionType, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const CMS_SECTION_KEYS = {
  hero: "HERO",
  benefits: "BENEFITS",
  gallery: "GALLERY",
  promo: "BANNER",
  stats: "STATISTICS",
  contactCta: "CONTACT_CTA",
  about: "ABOUT",
  contactPage: "CONTACT_PAGE",
} as const;

export type CmsSectionKey = keyof typeof CMS_SECTION_KEYS;

const DEFAULT_CONTENT: Record<HomepageSectionType, Record<string, unknown>> = {
  HERO: {
    eyebrow: "Best Quality Products",
    title: "Bringing Multan's Finest",
    titleHighlight: "Mangoes",
    subtitle: "Fresh to Your Table",
    description: "Premium export-quality mangoes delivered directly from orchards.",
    buttonText: "Get Started",
    buttonLink: "/products",
    backgroundImage: "",
    mobileBackgroundImage: "",
    inlineStats: [
      { value: "100%", label: "Export Quality" },
      { value: "Multan", label: "Direct Origin" },
      { value: "24h", label: "Fresh Harvest" },
    ],
  },
  BENEFITS: {
    sectionTitle: "Why Choose E Royal Mango",
    cards: [],
  },
  GALLERY: { items: [] },
  BANNER: {
    title: "",
    subtitle: "",
    buttonText: "Shop Now",
    buttonLink: "/products",
    backgroundImage: "",
  },
  STATISTICS: {
    customersCommunity: "10,000+",
    satisfactionRate: "98%",
    yearsInBusiness: "15+",
    countriesShipped: "12+",
  },
  CONTACT_CTA: {
    title: "Get In Touch",
    description: "Have questions about our premium mangoes?",
    buttonText: "Contact Us",
    buttonLink: "/contact",
  },
  ABOUT: {},
  CONTACT_PAGE: {},
};

export const cmsRepository = {
  async getOrCreate(type: HomepageSectionType) {
    let section = await prisma.homepageSection.findUnique({ where: { type } });
    if (!section) {
      section = await prisma.homepageSection.create({
        data: {
          type,
          content: DEFAULT_CONTENT[type] as Prisma.InputJsonValue,
          isVisible: true,
        },
      });
    }
    return section;
  },

  async getByKey(key: CmsSectionKey) {
    const type = CMS_SECTION_KEYS[key] as HomepageSectionType;
    return this.getOrCreate(type);
  },

  async updateByKey(key: CmsSectionKey, body: Record<string, unknown>) {
    const type = CMS_SECTION_KEYS[key] as HomepageSectionType;
    const existing = await this.getOrCreate(type);
    const { content: contentPatch, isVisible, ...rest } = body;
    const mergedContent = {
      ...(existing.content as Record<string, unknown>),
      ...((contentPatch as Record<string, unknown>) ?? rest),
    };

    return prisma.homepageSection.update({
      where: { type },
      data: {
        content: mergedContent as Prisma.InputJsonValue,
        ...(typeof isVisible === "boolean" ? { isVisible } : {}),
      },
    });
  },

  toApiSection(section: { id: string; content: unknown; isVisible: boolean; updatedAt: Date }) {
    return {
      ...((section.content as Record<string, unknown>) ?? {}),
      id: section.id,
      _id: section.id,
      isVisible: section.isVisible,
      updatedAt: section.updatedAt,
    };
  },

  async getAllPublic() {
    const entries = await Promise.all(
      Object.entries(CMS_SECTION_KEYS).map(async ([key, type]) => {
        const section = await this.getOrCreate(type as HomepageSectionType);
        if (!section.isVisible) return null;
        return [key, this.toApiSection(section)] as const;
      }),
    );
    return Object.fromEntries(entries.filter(Boolean) as [string, ReturnType<typeof this.toApiSection>][]);
  },

  async getPageSection(type: "ABOUT" | "CONTACT_PAGE") {
    const section = await this.getOrCreate(type);
    if (!section.isVisible) return null;
    return this.toApiSection(section);
  },
};
