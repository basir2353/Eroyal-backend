import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { blogRepository } from "../repositories/content.repository.js";
import { customerRepository } from "../repositories/customer.repository.js";
import { orderRepository } from "../repositories/order.repository.js";
import { testimonialRepository } from "../repositories/content.repository.js";
import { prisma } from "../lib/prisma.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { fillLast12Months } from "../utils/chartMonths.js";
import { mapOrder, serializeMany } from "../utils/serialize.js";

export async function getDashboardStats(_req: AuthRequest, res: Response) {
  const [
    totalOrders,
    pendingOrders,
    deliveredOrders,
    totalCustomers,
    totalProducts,
    totalBlogs,
    totalTestimonials,
    totalRevenue,
    recentOrders,
    recentCustomers,
    topProducts,
    latestBlogs,
    monthlyRevenue,
    monthlyCustomers,
  ] = await Promise.all([
    orderRepository.countByStatus(),
    orderRepository.countByStatus("pending"),
    orderRepository.countByStatus("delivered"),
    customerRepository.count(),
    prisma.product.count(),
    blogRepository.countPublished(),
    testimonialRepository.countPublished(),
    orderRepository.revenueTotal(),
    orderRepository.recent(5),
    customerRepository.recent(5),
    orderRepository.topProducts(5),
    blogRepository.latestPublished(5),
    orderRepository.monthlyStats(),
    customerRepository.monthlySignups(),
  ]);

  const monthlySeries = fillLast12Months(
    monthlyRevenue.map((r) => ({
      month: r.month,
      revenue: r.revenue,
      orders: r.orders,
    })),
  );

  const customerSeries = fillLast12Months(
    monthlyCustomers.map((r) => ({
      month: r.month,
      count: r.count,
    })),
  );

  return sendSuccess(res, {
    stats: {
      totalRevenue,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalCustomers,
      totalProducts,
      totalBlogs,
      totalTestimonials,
    },
    charts: {
      revenue: monthlySeries.map((r) => ({ _id: r.month, revenue: r.revenue ?? 0 })),
      orders: monthlySeries.map((r) => ({ _id: r.month, orders: r.orders ?? 0 })),
      customers: customerSeries.map((r) => ({ _id: r.month, count: r.count ?? 0 })),
    },
    widgets: {
      recentOrders: serializeMany(recentOrders).map((o) =>
        mapOrder(o as Record<string, unknown>),
      ),
      recentCustomers: serializeMany(recentCustomers),
      topProducts: topProducts.map((p) => ({ ...p, _id: p.slug })),
      latestBlogs: serializeMany(latestBlogs),
    },
  });
}
