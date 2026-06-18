import { PrismaClient } from "@prisma/client";
import { BLOG_POSTS } from "./seed-data";

const prisma = new PrismaClient();

async function main() {
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
    console.log("Upserted:", post.slug);
  }

  console.log("Blog seed completed:", BLOG_POSTS.length, "posts");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
