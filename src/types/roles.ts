export const ROLES = [
  "super_admin",
  "admin",
  "content_manager",
  "order_manager",
] as const;

export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "view",
  "create",
  "edit",
  "delete",
  "publish",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: ["view", "create", "edit", "delete", "publish"],
  admin: ["view", "create", "edit", "delete", "publish"],
  content_manager: ["view", "create", "edit", "publish"],
  order_manager: ["view", "edit"],
};

export const MODULES = [
  "dashboard",
  "cms",
  "products",
  "categories",
  "orders",
  "customers",
  "blogs",
  "faq",
  "testimonials",
  "contact",
  "media",
  "seo",
  "shipping",
  "coupons",
  "payments",
  "settings",
  "email",
  "users",
] as const;

export type Module = (typeof MODULES)[number];
