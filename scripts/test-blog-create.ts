import { PrismaClient } from "@prisma/client";
import { blogRepository } from "../src/repositories/content.repository.js";
import { createSlug } from "../src/utils/slug.js";

const prisma = new PrismaClient();

async function main() {
  const body = {
    title: "Test New Blog API",
    excerpt: "Test excerpt",
    content: "<p>Test content</p>",
    featuredImage: "/images/chaunsa-premium-variety.png",
    category: "Uncategorized",
    author: "E Royal Mango",
    authorEmail: "info@eroyalmango.com",
    status: "published",
  };
  const slug = createSlug(body.title);
  try {
    const doc = await blogRepository.create({ ...body, slug });
    console.log("OK", doc.id, doc.slug);
    await prisma.blog.delete({ where: { id: doc.id } });
  } catch (e) {
    console.error("ERR", e);
    process.exit(1);
  }
}

main().finally(() => prisma.$disconnect());
