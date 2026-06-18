import { prisma } from "../lib/prisma.js";

export const customerRepository = {
  async list(skip: number, limit: number) {
    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { orders: true } },
          orders: {
            where: { orderStatus: { notIn: ["CANCELLED", "REFUNDED"] } },
            select: { total: true },
          },
          addresses: true,
        },
      }),
      prisma.customer.count(),
    ]);
    return { items, total };
  },

  findById(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        addresses: true,
        orders: {
          orderBy: { createdAt: "desc" },
          include: {
            items: true,
            timeline: { orderBy: { createdAt: "asc" } },
          },
        },
      },
    });
  },

  update(id: string, data: Record<string, unknown>) {
    const mapped = { ...data };
    if ("isBlocked" in mapped) mapped.isBlocked = Boolean(mapped.isBlocked);
    if ("totalSpent" in mapped) {
      mapped.totalSpending = mapped.totalSpent;
      delete mapped.totalSpent;
    }
    return prisma.customer.update({ where: { id }, data: mapped as never });
  },

  delete(id: string) {
    return prisma.customer.delete({ where: { id } });
  },

  count() {
    return prisma.customer.count();
  },

  recent(limit = 5) {
    return prisma.customer.findMany({ take: limit, orderBy: { createdAt: "desc" } });
  },

  monthlySignups() {
    return prisma.$queryRaw<{ month: string; count: number }[]>`
      SELECT
        to_char("createdAt", 'YYYY-MM') as month,
        COUNT(*)::int as count
      FROM customers
      WHERE "createdAt" >= date_trunc('month', NOW()) - INTERVAL '11 months'
      GROUP BY month
      ORDER BY month ASC
    `;
  },
};
