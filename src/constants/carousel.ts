export const CAROUSEL_BANNER_WIDTH = 1024;
export const CAROUSEL_BANNER_HEIGHT = 320;
export const CAROUSEL_BANNER_ASPECT_RATIO = CAROUSEL_BANNER_WIDTH / CAROUSEL_BANNER_HEIGHT;
export const CAROUSEL_BANNER_SIZE_LABEL = `${CAROUSEL_BANNER_WIDTH} × ${CAROUSEL_BANNER_HEIGHT} px (3.2:1 aspect ratio)`;

export type CarouselSlideRecord = {
  id: string;
  image: string;
  alt: string;
  link: string;
  sortOrder: number;
  isActive: boolean;
};

export const DEFAULT_CAROUSEL_SLIDES: CarouselSlideRecord[] = [
  {
    id: "slide-1-keep-calm",
    image: "/images/hero-carousel/slide-1-keep-calm.png",
    alt: "Keep Calm and Eat Aam — E Royal Mango",
    link: "/products",
    sortOrder: 0,
    isActive: true,
  },
  {
    id: "slide-2-mango-magic",
    image: "/images/hero-carousel/slide-2-mango-magic.png",
    alt: "Create Mango Magic — E Royal Mango",
    link: "/products",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "slide-3-royal-bliss",
    image: "/images/hero-carousel/slide-3-royal-bliss.png",
    alt: "E Royal Mango — Royal Mango Bliss",
    link: "/products",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "slide-4-exquisite-variety",
    image: "/images/hero-carousel/slide-4-exquisite-variety.png",
    alt: "Explore our Exquisite Mango Variety — E Royal Mango",
    link: "/products",
    sortOrder: 3,
    isActive: true,
  },
];

export function sanitizeCarouselSlides(raw: unknown): CarouselSlideRecord[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const image = String(row.image ?? "").trim();
      if (!image) return null;

      return {
        id: String(row.id ?? `slide-${index}`),
        image,
        alt: String(row.alt ?? "E Royal Mango banner"),
        link: String(row.link ?? "/products").trim() || "/products",
        sortOrder: Number(row.sortOrder ?? index),
        isActive: row.isActive !== false,
      } satisfies CarouselSlideRecord;
    })
    .filter(Boolean)
    .sort((a, b) => a!.sortOrder - b!.sortOrder)
    .map((slide, index) => ({ ...slide!, sortOrder: index })) as CarouselSlideRecord[];
}

export function normalizeCarouselSlides(raw: unknown): CarouselSlideRecord[] {
  const sanitized = sanitizeCarouselSlides(raw);
  if (sanitized.length === 0) {
    return DEFAULT_CAROUSEL_SLIDES.map((slide) => ({ ...slide }));
  }
  return sanitized;
}

/** Public API — return saved slides exactly; defaults only when CMS never had slides. */
export function getPublicHeroSlides(raw: unknown): CarouselSlideRecord[] {
  if (raw === undefined || raw === null) {
    return DEFAULT_CAROUSEL_SLIDES.map((slide) => ({ ...slide }));
  }
  return sanitizeCarouselSlides(raw);
}
