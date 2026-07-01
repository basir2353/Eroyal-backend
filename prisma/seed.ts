import { PrismaClient, HomepageSectionType, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ROLE_PERMISSIONS } from "../src/types/roles.js";
import {
  ABOUT_CONTENT,
  BENEFITS_CARDS,
  BLOG_POSTS,
  CONTACT_PAGE_CONTENT,
  FAQ_ITEMS,
  GALLERY_ITEMS,
  MANGO_CATEGORIES,
  MANGO_PRODUCTS,
  TESTIMONIALS,
} from "./seed-data.js";
import { DEFAULT_CAROUSEL_SLIDES } from "../src/constants/carousel.js";

const prisma = new PrismaClient();

const ROLES = [
  { name: "super_admin", label: "Super Admin" },
  { name: "admin", label: "Admin" },
  { name: "content_manager", label: "Content Manager" },
  { name: "order_manager", label: "Order Manager" },
] as const;

const PERMISSIONS = ["view", "create", "edit", "delete", "publish"] as const;

const HOMEPAGE_DEFAULTS: Record<HomepageSectionType, Record<string, unknown>> = {
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
    slides: DEFAULT_CAROUSEL_SLIDES,
  },
  BENEFITS: {
    sectionTitle: "Why Choose E Royal Mango",
    sectionSubtitle: "Premium quality from orchard to your table",
    heroImage: "/images/chaunsa-premium-variety.png",
    cards: BENEFITS_CARDS,
  },
  GALLERY: {
    sectionTitle: "Mango Gallery",
    sectionSubtitle: "A glimpse of our premium harvest",
    items: GALLERY_ITEMS,
  },
  BANNER: {
    title: "Premium Mangoes",
    subtitle: "Direct from Multan orchards — order today",
    buttonText: "Shop Now",
    buttonLink: "/products",
    backgroundImage: "/images/dasheri-mango.png",
  },
  STATISTICS: {
    customersCommunity: "10,000+",
    satisfactionRate: "98%",
    yearsInBusiness: "15+",
    countriesShipped: "12+",
  },
  CONTACT_CTA: {
    title: "Ready to Taste Royal Quality?",
    description: "Order premium export-grade mangoes delivered fresh from Multan's orchards.",
    buttonText: "Contact Us",
    buttonLink: "/contact",
  },
  ABOUT: ABOUT_CONTENT,
  CONTACT_PAGE: CONTACT_PAGE_CONTENT,
};

async function main() {
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm },
      create: { name: perm },
      update: {},
    });
  }

  const permissionRows = await prisma.permission.findMany();
  const permMap = Object.fromEntries(permissionRows.map((p) => [p.name, p.id]));

  for (const role of ROLES) {
    const roleRow = await prisma.role.upsert({
      where: { name: role.name },
      create: { name: role.name, label: role.label },
      update: { label: role.label },
    });
    for (const perm of ROLE_PERMISSIONS[role.name]) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roleRow.id, permissionId: permMap[perm] } },
        create: { roleId: roleRow.id, permissionId: permMap[perm] },
        update: {},
      });
    }
  }

  const superAdminRole = await prisma.role.findUnique({ where: { name: "super_admin" } });
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@eroyalmango.com").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123456";

  if (superAdminRole) {
    const hash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.upsert({
      where: { email: adminEmail },
      create: {
        name: "Super Admin",
        email: adminEmail,
        password: hash,
        roleId: superAdminRole.id,
        status: "ACTIVE",
      },
      update: {
        password: hash,
        status: "ACTIVE",
        roleId: superAdminRole.id,
      },
    });
    console.log(`Admin ready: ${adminEmail} / ${adminPassword}`);
  }

  const categoryMap: Record<string, string> = {};
  for (const cat of MANGO_CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { slug: cat.slug },
      create: { name: cat.name, slug: cat.slug, description: `${cat.name} — premium export quality` },
      update: { name: cat.name },
    });
    categoryMap[cat.slug] = row.id;
  }

  for (const p of MANGO_PRODUCTS) {
    const weightOptions = p.weights?.map((w) => ({
      weight: w,
      price: p.weightPrices?.[w] ?? p.minPrice,
      salePrice: p.onSale ? p.weightPrices?.[w] ?? p.minPrice : undefined,
    }));

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      create: {
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription,
        fullDescription: p.descriptionParagraphs.join("\n\n"),
        descriptionTitle: p.descriptionTitle,
        descriptionParagraphs: p.descriptionParagraphs,
        additionalInfo: p.additionalInfo as Prisma.InputJsonValue,
        weightOptions: weightOptions as Prisma.InputJsonValue,
        regularPrice: p.maxPrice ?? p.minPrice,
        salePrice: p.onSale ? p.minPrice : null,
        onSale: p.onSale,
        featured: p.featured,
        mostLoved: p.mostLoved,
        status: "PUBLISHED",
        categoryId: categoryMap[p.categorySlug],
        stock: p.stock ?? 50,
        action: p.action,
        freeShipping: true,
        gallery: p.gallery ?? [p.image],
        sku: `ERM-${p.slug.toUpperCase().replace(/-/g, "")}`,
      },
      update: {
        name: p.name,
        shortDescription: p.shortDescription,
        regularPrice: p.maxPrice ?? p.minPrice,
        salePrice: p.onSale ? p.minPrice : null,
        onSale: p.onSale,
        weightOptions: weightOptions as Prisma.InputJsonValue,
        featured: p.featured,
        mostLoved: p.mostLoved,
        status: "PUBLISHED",
        stock: p.stock ?? 50,
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: { productId: product.id, url: p.image, alt: p.alt, isPrimary: true, sortOrder: 0 },
    });
    for (const [i, url] of (p.gallery ?? []).entries()) {
      if (url !== p.image) {
        await prisma.productImage.create({
          data: { productId: product.id, url, alt: p.alt, sortOrder: i + 1 },
        });
      }
    }
  }

  for (const [type, content] of Object.entries(HOMEPAGE_DEFAULTS)) {
    await prisma.homepageSection.upsert({
      where: { type: type as HomepageSectionType },
      create: { type: type as HomepageSectionType, content: content as Prisma.InputJsonValue, isVisible: true },
      update: { content: content as Prisma.InputJsonValue },
    });
  }

  await prisma.websiteSettings.deleteMany({});
  await prisma.websiteSettings.create({
    data: {
      siteName: "E Royal Mango",
      logo: "/images/e-royal-mango-logo.png",
      favicon: "/images/e-royal-mango-logo.png",
      contactPhone: "+92 307 3970850",
      contactEmail: "info@eroyalmango.com",
      whatsapp: "923073970850",
      address: "Multan, Punjab, Pakistan",
      footerContent:
        "E Royal Mango delivers Pakistan's finest export-quality mangoes — handpicked from Multan's legendary orchards with royal care.",
      copyrightText: "Copyright © 2025 | E Royal Mango",
      socialLinks: [
        {
          platform: "facebook",
          url: "https://www.facebook.com/share/1JxSFsbRoM/",
        },
        {
          platform: "instagram",
          url: "https://www.instagram.com/eroyalmango?utm_source=qr&igsh=MTV0bDE4MDc3ZnEzaA==",
        },
        {
          platform: "whatsapp",
          url: "https://whatsapp.com/channel/0029Vb7vuPXFHWq07oF9Yf3N",
        },
      ],
      announcementBarEnabled: true,
      announcementMessages: [
        {
          id: "cod",
          text: "💵 CASH ON DELIVERY — PAY AT YOUR DOORSTEP, ZERO RISK",
          isActive: true,
          sortOrder: 0,
        },
        {
          id: "fresh-mangoes",
          text: "🥭 FRESH EXPORT-QUALITY MANGOES — ORDER NOW",
          isActive: true,
          sortOrder: 1,
        },
        {
          id: "bank-transfer",
          text: "🏦 DIRECT BANK TRANSFER AVAILABLE — UPLOAD YOUR RECEIPT AFTER PAYMENT",
          isActive: true,
          sortOrder: 2,
        },
      ],
    },
  });

  if (!(await prisma.paymentSettings.findFirst())) {
    await prisma.paymentSettings.create({
      data: {
        cashOnDelivery: true,
        jazzCash: true,
        easyPaisa: true,
        bankTransfer: true,
        jazzCashAccount: "03073970850",
        easyPaisaAccount: "03154749309",
        bankName: "MCB",
        bankAccountTitle: "BABER SOHAIL",
        bankAccountNumber: "1436665541000808",
        bankIban: "PK42MUCB1436665541000808",
        paymentInstructions:
          "Transfer the exact order total and upload your payment screenshot or receipt below.",
      },
    });
  }
  if (!(await prisma.shippingRule.findFirst())) {
    await prisma.shippingRule.create({ data: { name: "Default", pakistanCharge: 0, zones: [] } });
  }
  if (!(await prisma.emailSettings.findFirst())) {
    await prisma.emailSettings.create({ data: { senderName: "E Royal Mango" } });
  }
  if (!(await prisma.smsSettings.findFirst())) {
    await prisma.smsSettings.create({
      data: {
        enabled: false,
        channel: "auto",
        orderPlacedEnabled: true,
      },
    });
  }

  for (const t of [
    { key: "order_confirmation", body: "Your order {{orderNumber}} has been confirmed." },
    { key: "shipping_update", body: "Your order {{orderNumber}} has been shipped." },
    { key: "contact_form", body: "New contact message from {{name}}." },
    { key: "password_reset", body: "Reset your password using this link: {{resetLink}}" },
  ]) {
    await prisma.emailTemplate.upsert({ where: { key: t.key }, create: t, update: {} });
  }

  for (const post of BLOG_POSTS) {
    const publishedAt = post.publishedAt ? new Date(post.publishedAt) : new Date();
    await prisma.blog.upsert({
      where: { slug: post.slug },
      create: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        featuredImage: post.featuredImage,
        author: post.author,
        authorEmail: post.authorEmail,
        status: "PUBLISHED",
        categoryName: post.categoryName,
        publishedAt,
        createdAt: publishedAt,
      },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        featuredImage: post.featuredImage,
        author: post.author,
        authorEmail: post.authorEmail,
        categoryName: post.categoryName,
        status: "PUBLISHED",
        publishedAt,
      },
    });
  }

  await prisma.faq.deleteMany({});
  for (const faq of FAQ_ITEMS) {
    await prisma.faq.create({ data: faq });
  }

  await prisma.testimonial.deleteMany({});
  for (const [i, t] of TESTIMONIALS.entries()) {
    await prisma.testimonial.create({
      data: { ...t, status: "PUBLISHED", sortOrder: i },
    });
  }

  console.log("Seed completed:", {
    categories: MANGO_CATEGORIES.length,
    products: MANGO_PRODUCTS.length,
    blogs: BLOG_POSTS.length,
    faqs: FAQ_ITEMS.length,
    testimonials: TESTIMONIALS.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
