import type { Prisma } from "@prisma/client";
import type { InputJsonValue } from "@prisma/client/runtime/library";
import { prisma } from "../lib/prisma.js";
import { toOrderStatus } from "../utils/serialize.js";
import type { CreateOrderInput } from "../validators/order.validator.js";

function buildCustomerInfo(raw: CreateOrderInput["customerInfo"]) {
  const firstName = String(raw.firstName ?? "").trim();
  const lastName = String(raw.lastName ?? "").trim();
  const fullName =
    String(raw.name ?? "").trim() ||
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    "Guest";

  return {
    firstName: firstName || fullName.split(" ")[0] || fullName,
    lastName: lastName || fullName.split(" ").slice(1).join(" ") || "",
    name: fullName,
    email: String(raw.email).trim().toLowerCase(),
    phone: String(raw.phone).trim(),
    address: {
      company: raw.address.company?.trim() || "",
      address1: String(raw.address.address1).trim(),
      address2: raw.address.address2?.trim() || "",
      city: String(raw.address.city).trim(),
      state: String(raw.address.state).trim(),
      postcode: String(raw.address.postcode).trim(),
      country: String(raw.address.country).trim(),
    },
  };
}

export const orderRepository = {
  async list(query: Record<string, unknown>, skip: number, limit: number) {
    const where: Prisma.OrderWhereInput = {};
    if (query.status) where.orderStatus = toOrderStatus(String(query.status));

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, email: true } },
          items: true,
          timeline: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);
    return { items, total };
  },

  findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        timeline: { orderBy: { createdAt: "asc" } },
      },
    });
  },

  async create(data: CreateOrderInput | Record<string, unknown>) {
    const payload = data as CreateOrderInput;
    const orderNumber = `ERM-${Date.now().toString(36).toUpperCase()}`;
    const items = payload.items ?? [];
    const customerInfo = buildCustomerInfo(payload.customerInfo);

    let customerId = payload.customerId ? String(payload.customerId) : undefined;
    if (!customerId && customerInfo.email) {
      const customer = await prisma.customer.upsert({
        where: { email: customerInfo.email },
        create: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
        },
        update: {
          name: customerInfo.name,
          phone: customerInfo.phone,
        },
      });
      customerId = customer.id;
    }

    if (!customerId) throw new Error("Customer required");

    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          subtotal: Number(payload.subtotal ?? 0),
          shippingCost: Number(payload.shippingCost ?? 0),
          tax: Number(payload.tax ?? 0),
          discount: Number(payload.discount ?? 0),
          total: Number(payload.total ?? 0),
          paymentMethod: String(payload.paymentMethod ?? "cash_on_delivery"),
          orderStatus: "PENDING",
          paymentStatus: "PENDING",
          couponCode: payload.couponCode ? String(payload.couponCode) : undefined,
          notes: payload.notes ? String(payload.notes).trim() : undefined,
          customerInfo: customerInfo as unknown as InputJsonValue,
        },
      });

      const productSlugs = [...new Set(items.map((item) => String(item.slug)))];
      const products = await tx.product.findMany({
        where: { slug: { in: productSlugs } },
        select: { id: true, slug: true },
      });
      const productBySlug = Object.fromEntries(products.map((p) => [p.slug, p.id]));

      if (items.length) {
        await tx.orderItem.createMany({
          data: items.map((item) => ({
            orderId: order.id,
            productId:
              item.productId ||
              item.product ||
              productBySlug[String(item.slug)] ||
              undefined,
            name: String(item.name),
            slug: String(item.slug),
            image: item.image ? String(item.image) : undefined,
            weight: item.weight ? String(item.weight) : undefined,
            quantity: Number(item.quantity ?? 1),
            unitPrice: Number(item.unitPrice ?? 0),
            lineTotal: Number(item.lineTotal ?? 0),
          })),
        });
      }

      const addr = customerInfo.address;
      const addressLine = [addr.address1, addr.address2].filter(Boolean).join(", ");
      const existingAddress = await tx.address.findFirst({
        where: {
          customerId,
          address: addressLine,
          city: addr.city,
          postcode: addr.postcode ?? undefined,
        },
      });
      if (!existingAddress && addressLine) {
        await tx.address.create({
          data: {
            customerId,
            label: "Checkout",
            address: addressLine,
            city: addr.city,
            state: addr.state,
            postcode: addr.postcode,
            country: addr.country,
            isDefault: false,
          },
        });
      }

      await tx.orderTimeline.create({
        data: { orderId: order.id, status: "PENDING", note: "Order placed" },
      });

      const orderTotal = Number(payload.total ?? 0);
      await tx.customer.update({
        where: { id: customerId },
        data: {
          totalSpending: { increment: orderTotal },
        },
      });

      return tx.order.findUnique({
        where: { id: order.id },
        include: { customer: true, items: true, timeline: true },
      });
    });
  },

  markConfirmationEmailSent(orderId: string) {
    return prisma.order.update({
      where: { id: orderId },
      data: {
        confirmationEmailSentAt: new Date(),
        confirmationEmailError: null,
      },
    });
  },

  markConfirmationEmailFailed(orderId: string, errorMessage: string) {
    return prisma.order.update({
      where: { id: orderId },
      data: {
        confirmationEmailError: errorMessage.slice(0, 500),
      },
    });
  },

  async updateStatus(id: string, status: string, note?: string, trackingNumber?: string) {
    const orderStatus = toOrderStatus(status);
    return prisma.$transaction(async (tx) => {
      await tx.orderTimeline.create({
        data: { orderId: id, status: orderStatus, note },
      });
      return tx.order.update({
        where: { id },
        data: {
          orderStatus,
          ...(trackingNumber ? { trackingNumber } : {}),
        },
        include: { customer: true, items: true, timeline: { orderBy: { createdAt: "asc" } } },
      });
    });
  },

  countByStatus(status?: string) {
    return prisma.order.count({
      where: status ? { orderStatus: toOrderStatus(status) } : undefined,
    });
  },

  async revenueTotal() {
    const result = await prisma.order.aggregate({
      _sum: { total: true },
      where: { orderStatus: { notIn: ["CANCELLED", "REFUNDED"] } },
    });
    return result._sum.total?.toNumber() ?? 0;
  },

  recent(limit = 5) {
    return prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
  },

  async monthlyStats() {
    return prisma.$queryRaw<{ month: string; revenue: number; orders: number }[]>`
      SELECT
        to_char("createdAt", 'YYYY-MM') as month,
        COALESCE(SUM(total), 0)::float as revenue,
        COUNT(*)::int as orders
      FROM orders
      WHERE "orderStatus" NOT IN ('CANCELLED', 'REFUNDED')
        AND "createdAt" >= date_trunc('month', NOW()) - INTERVAL '11 months'
      GROUP BY month
      ORDER BY month ASC
    `;
  },

  async topProducts(limit = 5) {
    return prisma.$queryRaw<{ slug: string; name: string; sold: number; revenue: number }[]>`
      SELECT
        slug,
        MAX(name) as name,
        SUM(quantity)::int as sold,
        COALESCE(SUM("lineTotal"), 0)::float as revenue
      FROM order_items
      GROUP BY slug
      ORDER BY sold DESC
      LIMIT ${limit}
    `;
  },
};
