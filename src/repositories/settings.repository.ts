import type { CouponType, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { DEFAULT_ANNOUNCEMENT_MESSAGES } from "../constants/defaultAnnouncements.js";

async function getSingletonWebsite() {
  let row = await prisma.websiteSettings.findFirst();
  if (!row) {
    row = await prisma.websiteSettings.create({
      data: {
        announcementBarEnabled: true,
        announcementMessages:
          DEFAULT_ANNOUNCEMENT_MESSAGES as unknown as Prisma.InputJsonValue,
      },
    });
  }
  return row;
}

async function getSingletonPayment() {
  let row = await prisma.paymentSettings.findFirst();
  if (!row) row = await prisma.paymentSettings.create({ data: {} });
  return row;
}

async function getSingletonShipping() {
  let row = await prisma.shippingRule.findFirst({ where: { isActive: true } });
  if (!row) {
    row = await prisma.shippingRule.create({ data: { name: "Default", zones: [] } });
  }
  return row;
}

async function getSingletonEmail() {
  let row = await prisma.emailSettings.findFirst();
  if (!row) row = await prisma.emailSettings.create({ data: {} });
  return row;
}

async function getSingletonSms() {
  let row = await prisma.smsSettings.findFirst();
  if (!row) row = await prisma.smsSettings.create({ data: {} });
  return row;
}

export const settingsRepository = {
  getWebsite: getSingletonWebsite,
  updateWebsite: async (data: Record<string, unknown>) => {
    const row = await getSingletonWebsite();
    return prisma.websiteSettings.update({ where: { id: row.id }, data: data as never });
  },

  getPayment: getSingletonPayment,
  updatePayment: async (data: Record<string, unknown>) => {
    const row = await getSingletonPayment();
    const mapped = { ...data };
    if ("easyPaisaDetails" in mapped) {
      mapped.easyPaisaAccount = mapped.easyPaisaDetails;
      delete mapped.easyPaisaDetails;
    }
    if ("jazzCashDetails" in mapped) {
      mapped.jazzCashAccount = mapped.jazzCashDetails;
      delete mapped.jazzCashDetails;
    }
    return prisma.paymentSettings.update({ where: { id: row.id }, data: mapped as never });
  },

  getShipping: getSingletonShipping,
  updateShipping: async (data: Record<string, unknown>) => {
    const row = await getSingletonShipping();
    return prisma.shippingRule.update({ where: { id: row.id }, data: data as never });
  },

  async getEmail() {
    const [settings, templates] = await Promise.all([
      getSingletonEmail(),
      prisma.emailTemplate.findMany(),
    ]);
    const templateMap = Object.fromEntries(templates.map((t) => [t.key, t.body]));
    return {
      ...settings,
      orderConfirmationTemplate: templateMap.order_confirmation ?? "",
      shippingUpdateTemplate: templateMap.shipping_update ?? "",
      contactFormTemplate: templateMap.contact_form ?? "",
      passwordResetTemplate: templateMap.password_reset ?? "",
    };
  },

  async updateEmail(data: Record<string, unknown>) {
    const row = await getSingletonEmail();
    const {
      orderConfirmationTemplate,
      shippingUpdateTemplate,
      contactFormTemplate,
      passwordResetTemplate,
      ...smtp
    } = data;

    await prisma.emailSettings.update({ where: { id: row.id }, data: smtp as never });

    const templateUpdates = [
      ["order_confirmation", orderConfirmationTemplate],
      ["shipping_update", shippingUpdateTemplate],
      ["contact_form", contactFormTemplate],
      ["password_reset", passwordResetTemplate],
    ] as const;

    for (const [key, body] of templateUpdates) {
      if (typeof body === "string") {
        await prisma.emailTemplate.upsert({
          where: { key },
          create: { key, body },
          update: { body },
        });
      }
    }

    return this.getEmail();
  },

  getSms: getSingletonSms,
  updateSms: async (data: Record<string, unknown>) => {
    const row = await getSingletonSms();
    return prisma.smsSettings.update({ where: { id: row.id }, data: data as never });
  },

  listSeo() {
    return prisma.seoSetting.findMany({ orderBy: { page: "asc" } });
  },

  listCoupons() {
    return prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  },

  createCoupon(data: Record<string, unknown>) {
    return prisma.coupon.create({ data: data as never });
  },

  updateCoupon(id: string, data: Record<string, unknown>) {
    return prisma.coupon.update({ where: { id }, data: data as never });
  },

  deleteCoupon(id: string) {
    return prisma.coupon.delete({ where: { id } });
  },
};

export function mapPaymentForApi(row: Record<string, unknown>) {
  return {
    ...row,
    easyPaisaDetails: row.easyPaisaAccount,
    jazzCashDetails: row.jazzCashAccount,
  };
}

export function mapPaymentForPublic(row: Record<string, unknown>) {
  return {
    cashOnDelivery: row.cashOnDelivery,
    easyPaisa: row.easyPaisa,
    jazzCash: row.jazzCash,
    bankTransfer: row.bankTransfer,
    jazzCashAccount: row.jazzCashAccount,
    easyPaisaAccount: row.easyPaisaAccount,
    bankName: row.bankName,
    bankAccountTitle: row.bankAccountTitle,
    bankAccountNumber: row.bankAccountNumber,
    bankIban: row.bankIban,
    bankDetails: row.bankDetails,
    paymentInstructions: row.paymentInstructions,
  };
}

export function mapCouponForApi(row: Record<string, unknown>) {
  if (row.type) row.type = String(row.type).toLowerCase();
  if (row.expiryDate) row.expiresAt = row.expiryDate;
  return row;
}

export function mapCouponInput(data: Record<string, unknown>) {
  const input = { ...data };
  if (input.type) input.type = String(input.type).toUpperCase() as CouponType;
  if (input.expiresAt) {
    input.expiryDate = new Date(String(input.expiresAt));
    delete input.expiresAt;
  }
  if (input.code) input.code = String(input.code).toUpperCase();
  return input;
}
