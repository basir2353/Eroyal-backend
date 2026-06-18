import { Decimal } from "@prisma/client/runtime/library";

function isDecimalLike(value: unknown): value is { toNumber: () => number } {
  return (
    value !== null &&
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as { toNumber?: () => number }).toNumber === "function"
  );
}

function decimalFromPlainObject(value: { s?: number; e?: number; d?: number[] }): number | null {
  if (!Array.isArray(value.d) || value.d.length === 0) return null;
  const digits = value.d.join("");
  if (!digits) return 0;
  const exponent = (value.e ?? 0) - digits.length + 1;
  const num = Number(digits) * 10 ** exponent;
  return (value.s ?? 1) < 0 ? -num : num;
}

function convertValue(value: unknown): unknown {
  if (value instanceof Decimal || isDecimalLike(value)) {
    return (value as { toNumber: () => number }).toNumber();
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(convertValue);
  if (value !== null && typeof value === "object") {
    const plain = value as { s?: number; e?: number; d?: number[] };
    const fromPlain = decimalFromPlainObject(plain);
    if (fromPlain !== null && Array.isArray(plain.d) && "e" in plain) {
      return fromPlain;
    }

    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = convertValue(v);
    }
    if (typeof out.id === "string") out._id = out.id;
    return out;
  }
  return value;
}

export function serialize<T>(data: T): T {
  return convertValue(data) as T;
}

export function serializeMany<T>(items: T[]): T[] {
  return items.map((item) => serialize(item));
}

export function toProductStatus(status: string) {
  return status.toUpperCase() as "DRAFT" | "PUBLISHED" | "HIDDEN";
}

export function fromProductStatus(status: string) {
  return status.toLowerCase();
}

export function toContentStatus(status: string) {
  const upper = status.toUpperCase();
  if (upper === "HIDDEN") return "HIDDEN" as const;
  if (upper === "PUBLISHED") return "PUBLISHED" as const;
  return "DRAFT" as const;
}

export function fromContentStatus(status: string) {
  return status.toLowerCase();
}

export function toOrderStatus(status: string) {
  return status.toUpperCase() as
    | "PENDING"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "REFUNDED";
}

export function fromOrderStatus(status: string) {
  return status.toLowerCase();
}

export function toCouponType(type: string) {
  const map: Record<string, "PERCENTAGE" | "FIXED" | "FREE_SHIPPING"> = {
    percentage: "PERCENTAGE",
    fixed: "FIXED",
    free_shipping: "FREE_SHIPPING",
  };
  return map[type.toLowerCase()] ?? "PERCENTAGE";
}

export function fromCouponType(type: string) {
  return type.toLowerCase();
}

import { resolveAssetUrl } from "./assets.js";
import { applyEffectiveOffer } from "./productOffer.js";

export function mapProduct(
  doc: Record<string, unknown>,
  options?: { publicView?: boolean },
) {
  const serialized = serialize(doc) as Record<string, unknown>;
  if (serialized.status) serialized.status = fromProductStatus(String(serialized.status));
  if (serialized.featured !== undefined) serialized.isFeatured = serialized.featured;
  if (serialized.mostLoved !== undefined) serialized.isMostLoved = serialized.mostLoved;
  if (serialized.fullDescription !== undefined) {
    serialized.descriptionParagraphs = serialized.descriptionParagraphs ?? [];
  }
  if (Array.isArray(serialized.images)) {
    const imgs = serialized.images as ({ url?: string } | string)[];
    if (imgs[0] && typeof imgs[0] === "object" && imgs[0] !== null && "url" in imgs[0]) {
      serialized.images = imgs.map((i) =>
        resolveAssetUrl(typeof i === "string" ? i : String(i.url ?? "")),
      );
    } else {
      serialized.images = imgs.map((i) => resolveAssetUrl(String(i)));
    }
  }
  if (Array.isArray(serialized.gallery)) {
    serialized.gallery = (serialized.gallery as string[]).map((url) => resolveAssetUrl(url));
  }
  if (serialized.category && typeof serialized.category === "object") {
    const cat = serialized.category as Record<string, unknown>;
    serialized.categoryId = cat.id ?? cat._id;
    serialized.categoryName = cat.name;
    serialized.category = cat.id ?? cat._id;
  }
  if (options?.publicView) {
    applyEffectiveOffer(serialized);
  }
  return serialized;
}

export function mapOrder(doc: Record<string, unknown>) {
  const serialized = serialize(doc) as Record<string, unknown>;
  if (serialized.orderStatus) serialized.status = fromOrderStatus(String(serialized.orderStatus));
  if (serialized.paymentStatus) {
    serialized.paymentStatusLabel = String(serialized.paymentStatus).toLowerCase();
  }
  if (serialized.customer && typeof serialized.customer === "object") {
    const c = serialized.customer as Record<string, unknown>;
    serialized.customer = {
      _id: c.id ?? c._id,
      id: c.id ?? c._id,
      name: c.name,
      email: c.email,
      phone: c.phone,
    };
  }
  const info = serialized.customerInfo as Record<string, unknown> | undefined;
  if (info && typeof info === "object") {
    serialized.customerName = info.name ?? (serialized.customer as Record<string, unknown> | undefined)?.name;
    serialized.customerEmail = info.email ?? (serialized.customer as Record<string, unknown> | undefined)?.email;
    serialized.customerPhone = info.phone;
    serialized.shippingAddress = info.address;
  }
  if (Array.isArray(serialized.items)) {
    serialized.items = (serialized.items as Record<string, unknown>[]).map((item) => {
      if (item.product && typeof item.product === "object") {
        const p = item.product as Record<string, unknown>;
        item.product = p.id ?? p._id;
      }
      return item;
    });
    serialized.itemCount = (serialized.items as unknown[]).reduce<number>(
      (sum, item) => sum + Number((item as Record<string, unknown>).quantity ?? 0),
      0,
    );
  }
  return serialized;
}

export function mapCustomer(doc: Record<string, unknown>) {
  const serialized = serialize(doc) as Record<string, unknown>;
  const orders = serialized.orders as { total?: number }[] | undefined;
  if (Array.isArray(orders) && orders.length && typeof orders[0] === "object" && "total" in orders[0]) {
    serialized.totalSpent = orders.reduce((sum, o) => sum + Number(o.total ?? 0), 0);
  } else {
    serialized.totalSpent = serialized.totalSpending;
  }
  const countMeta = serialized._count as { orders?: number } | undefined;
  serialized.orderCount = countMeta?.orders ?? (Array.isArray(orders) ? orders.length : 0);
  delete serialized._count;
  serialized.isActive = !serialized.isBlocked;
  return serialized;
}

export function mapUser(doc: Record<string, unknown>) {
  const serialized = serialize(doc) as Record<string, unknown>;
  if (serialized.role && typeof serialized.role === "object") {
    const role = serialized.role as Record<string, unknown>;
    serialized.role = role.name;
  }
  serialized.isActive = serialized.status === "ACTIVE";
  delete serialized.password;
  return serialized;
}
