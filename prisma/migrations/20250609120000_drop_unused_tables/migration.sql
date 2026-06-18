-- Remove unused tables: wishlists (frontend uses browser storage), blog_categories (blogs use categoryName only)

ALTER TABLE "blogs" DROP CONSTRAINT IF EXISTS "blogs_categoryId_fkey";
ALTER TABLE "blogs" DROP COLUMN IF EXISTS "categoryId";

DROP TABLE IF EXISTS "wishlists";
DROP TABLE IF EXISTS "blog_categories";
