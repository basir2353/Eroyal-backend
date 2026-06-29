export type OfferFields = {
  onSale?: boolean | null;
  salePrice?: number | string | null;
  regularPrice?: number | string | null;
  saleBadge?: string | null;
  discountPercent?: number | null;
  offerStartDate?: Date | string | null;
  offerEndDate?: Date | string | null;
};

function toNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

/** Max value for @db.Decimal(12, 2) columns. */
export const MAX_DB_PRICE = 9_999_999_999.99;

export function sanitizePrice(value: unknown, label = "Price"): number {
  const num = toNumber(value);
  if (num == null) {
    throw new Error(`${label} must be a valid number`);
  }
  if (num < 0) {
    throw new Error(`${label} cannot be negative`);
  }
  if (num > MAX_DB_PRICE) {
    throw new Error(`${label} cannot exceed ${MAX_DB_PRICE.toLocaleString("en-PK")} PKR`);
  }
  return Math.round(num * 100) / 100;
}

function toDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Whether a configured offer should display on the storefront right now. */
export function isOfferActive(offer: OfferFields, now = new Date()): boolean {
  if (!offer.onSale) return false;

  const salePrice = toNumber(offer.salePrice);
  const regularPrice = toNumber(offer.regularPrice);
  if (salePrice == null || regularPrice == null || salePrice >= regularPrice) return false;

  const start = toDate(offer.offerStartDate);
  const end = toDate(offer.offerEndDate);
  if (start && now < start) return false;
  if (end && now > end) return false;

  return true;
}

export function computeDiscountPercent(regularPrice: number, salePrice: number): number {
  if (regularPrice <= 0 || salePrice >= regularPrice) return 0;
  return Math.round((1 - salePrice / regularPrice) * 100);
}

export function normalizeOfferInput(data: Record<string, unknown>) {
  const onSale = Boolean(data.onSale);
  const regularPrice = toNumber(data.regularPrice);
  const salePrice =
    data.salePrice != null && data.salePrice !== "" ? toNumber(data.salePrice) : null;

  let discountPercent =
    data.discountPercent != null && data.discountPercent !== ""
      ? Math.round(Number(data.discountPercent))
      : null;

  if (onSale && regularPrice != null && salePrice != null) {
    if (discountPercent == null || Number.isNaN(discountPercent)) {
      discountPercent = computeDiscountPercent(regularPrice, salePrice);
    }
  } else if (!onSale) {
    discountPercent = null;
  }

  const saleBadge =
    onSale && String(data.saleBadge ?? "").trim()
      ? String(data.saleBadge).trim().slice(0, 40)
      : null;

  const offerStartDate = toDate(data.offerStartDate);
  const offerEndDate = toDate(data.offerEndDate);

  return {
    onSale,
    salePrice: onSale ? salePrice : null,
    saleBadge: onSale ? saleBadge : null,
    discountPercent: onSale ? discountPercent : null,
    offerStartDate: onSale ? offerStartDate : null,
    offerEndDate: onSale ? offerEndDate : null,
  };
}

type WeightOptionRow = { weight?: string; price?: number; salePrice?: number };

export function isValidWeightOptions(raw: unknown): boolean {
  if (!Array.isArray(raw) || raw.length === 0) return false;
  const weights = raw
    .filter((item) => item && typeof item === "object" && "weight" in item)
    .map((item) => String((item as WeightOptionRow).weight).toLowerCase());
  return weights.includes("5kg") && weights.includes("10kg");
}

/** Default 5kg / 10kg tiers when admin does not configure weight options. */
export function buildDefaultWeightOptions(
  regularPrice: number,
  salePrice: number | null,
  onSale: boolean,
): WeightOptionRow[] {
  const regular = sanitizePrice(regularPrice, "Regular price");
  const fiveKgRegular = Math.max(1, Math.round(regular * 0.6));
  const fiveKgSale =
    onSale && salePrice != null ? sanitizePrice(salePrice, "Sale price") : fiveKgRegular;

  return [
    {
      weight: "5kg",
      price: fiveKgRegular,
      ...(onSale && salePrice != null ? { salePrice: fiveKgSale } : {}),
    },
    { weight: "10kg", price: regular },
  ];
}

export function ensureWeightOptions(
  raw: unknown,
  regularPrice: number,
  salePrice: number | null,
  onSale: boolean,
): WeightOptionRow[] {
  if (isValidWeightOptions(raw)) {
    return raw as WeightOptionRow[];
  }
  return buildDefaultWeightOptions(regularPrice, salePrice, onSale);
}

export function stripWeightOptionSalePrices(weightOptions: unknown): unknown {
  if (!Array.isArray(weightOptions)) return weightOptions;
  return weightOptions.map((option) => {
    if (!option || typeof option !== "object") return option;
    const { salePrice: _removed, ...rest } = option as WeightOptionRow;
    return rest;
  });
}

/** Remove tier sale prices when product offer is disabled. */
export function applyOfferToWeightOptions(
  weightOptions: unknown,
  onSale: boolean,
): unknown {
  if (!onSale) return stripWeightOptionSalePrices(weightOptions);
  return weightOptions;
}

/** Public API / storefront fields derived from stored offer config. */
export function applyEffectiveOffer<T extends Record<string, unknown> & OfferFields & { weightOptions?: unknown }>(
  product: T,
  now = new Date(),
): T {
  const active = isOfferActive(
    {
      onSale: Boolean(product.onSale),
      salePrice: product.salePrice as string | number | null | undefined,
      regularPrice: product.regularPrice as string | number | null | undefined,
      offerStartDate: product.offerStartDate as string | Date | null | undefined,
      offerEndDate: product.offerEndDate as string | Date | null | undefined,
    },
    now,
  );

  product.onSale = active;
  const regularPrice = sanitizePrice(product.regularPrice, "Regular price");
  const salePrice =
    active && product.salePrice != null
      ? sanitizePrice(product.salePrice, "Sale price")
      : null;
  product.weightOptions = applyOfferToWeightOptions(
    ensureWeightOptions(product.weightOptions, regularPrice, salePrice, active),
    active,
  );
  if (!active) {
    product.saleBadge = null;
    product.discountPercent = null;
    product.salePrice = null;
    product.weightOptions = stripWeightOptionSalePrices(product.weightOptions);
  } else {
    if (product.discountPercent == null) {
      const regularPrice = toNumber(product.regularPrice);
      const salePrice = toNumber(product.salePrice);
      if (regularPrice != null && salePrice != null && salePrice < regularPrice) {
        product.discountPercent = computeDiscountPercent(regularPrice, salePrice);
      }
    }
  }

  return product;
}
