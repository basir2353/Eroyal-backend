import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import * as auth from "../controllers/auth.controller.js";
import * as dashboard from "../controllers/dashboard.controller.js";
import * as cms from "../controllers/cms.controller.js";
import * as product from "../controllers/product.controller.js";
import * as settings from "../controllers/settings.controller.js";
import orderRoutes from "./order.routes.js";
import emailRoutes from "./email.routes.js";
import * as customer from "../controllers/customer.controller.js";
import * as category from "../controllers/category.controller.js";
import * as content from "../controllers/content.controller.js";
import * as contact from "../controllers/contact.controller.js";
import * as userCtrl from "../controllers/user.controller.js";
import * as mediaCtrl from "../controllers/media.controller.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { validateBody } from "../middleware/validate.js";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validators/auth.validator.js";

const router = Router();

// Public storefront API
router.get("/public/cms", cms.getPublicCms);
router.get("/public/products", product.listPublicProducts);
router.get("/public/products/:slug", product.getPublicProduct);
router.get("/public/about", cms.getPublicAbout);
router.get("/public/settings", settings.getPublicSettings);
router.get("/public/blogs", content.listPublicBlogs);
router.get("/public/blogs/:slug", content.getPublicBlog);
router.get("/public/faq", content.listPublicFaq);
router.get("/public/testimonials", content.listPublicTestimonials);
router.get("/public/categories", category.listPublicCategories);
router.use(orderRoutes);
router.use(emailRoutes);
router.post("/public/contact", contact.createPublicContact);

// Auth
router.post("/auth/login", validateBody(loginSchema), auth.login);
router.post("/auth/register", validateBody(registerSchema), auth.register);
router.post("/auth/forgot-password", auth.forgotPassword);
router.post("/auth/reset-password", validateBody(resetPasswordSchema), auth.resetPassword);
router.get("/auth/me", authenticate, auth.me);
router.post("/auth/change-password", authenticate, validateBody(changePasswordSchema), auth.changePassword);
router.post("/auth/logout", authenticate, (_req, res) => sendSuccess(res, null, "Logged out"));

// Dashboard
router.get("/dashboard", authenticate, authorize("view"), dashboard.getDashboardStats);

// CMS
router.get("/cms/:section", authenticate, authorize("view"), cms.getCmsSection);
router.put("/cms/:section", authenticate, authorize("edit"), cms.updateCmsSection);

// Products
router.get("/products", authenticate, authorize("view"), product.listProducts);
router.post("/products", authenticate, authorize("create"), product.createProduct);
router.put("/products/bulk", authenticate, authorize("edit"), product.bulkProductAction);
router.put("/products/:id", authenticate, authorize("edit"), product.updateProduct);
router.delete("/products/:id", authenticate, authorize("delete"), product.deleteProduct);

// Categories
router.get("/categories", authenticate, authorize("view"), category.listCategories);
router.post("/categories", authenticate, authorize("create"), category.createCategory);
router.put("/categories/:id", authenticate, authorize("edit"), category.updateCategory);
router.delete("/categories/:id", authenticate, authorize("delete"), category.deleteCategory);

// Customers
router.get("/customers", authenticate, authorize("view"), customer.listCustomers);
router.get("/customers/:id", authenticate, authorize("view"), customer.getCustomer);
router.patch("/customers/:id", authenticate, authorize("edit"), customer.updateCustomer);
router.delete("/customers/:id", authenticate, authorize("delete"), customer.deleteCustomer);

// Blogs
router.get("/blogs", authenticate, authorize("view"), content.listBlogs);
router.post("/blogs", authenticate, authorize("create"), content.createBlog);
router.put("/blogs/:id", authenticate, authorize("edit"), content.updateBlog);
router.delete("/blogs/:id", authenticate, authorize("delete"), content.deleteBlog);

// FAQ
router.get("/faq", authenticate, authorize("view"), content.listFaq);
router.post("/faq", authenticate, authorize("create"), content.createFaq);
router.put("/faq/:id", authenticate, authorize("edit"), content.updateFaq);
router.delete("/faq/:id", authenticate, authorize("delete"), content.deleteFaq);

// Testimonials
router.get("/testimonials", authenticate, authorize("view"), content.listTestimonials);
router.post("/testimonials", authenticate, authorize("create"), content.createTestimonial);
router.put("/testimonials/:id", authenticate, authorize("edit"), content.updateTestimonial);
router.delete("/testimonials/:id", authenticate, authorize("delete"), content.deleteTestimonial);

// Contact messages
router.get("/contact", authenticate, authorize("view"), contact.listContactMessages);
router.patch("/contact/:id", authenticate, authorize("edit"), contact.updateContactMessage);

// Media
router.get("/media", authenticate, authorize("view"), mediaCtrl.listMedia);
router.post("/media", authenticate, authorize("create"), mediaCtrl.upload.single("file"), mediaCtrl.uploadMedia);
router.post("/media/url", authenticate, authorize("create"), mediaCtrl.createMediaUrl);
router.delete("/media/:id", authenticate, authorize("delete"), mediaCtrl.deleteMedia);

// Settings
router.get("/settings/website", authenticate, authorize("view"), settings.getWebsiteSettings);
router.put("/settings/website", authenticate, authorize("edit"), settings.updateWebsiteSettings);
router.get("/settings/payments", authenticate, authorize("view"), settings.getPaymentSettings);
router.put("/settings/payments", authenticate, authorize("edit"), settings.updatePaymentSettings);
router.get("/settings/shipping", authenticate, authorize("view"), settings.getShippingSettings);
router.put("/settings/shipping", authenticate, authorize("edit"), settings.updateShippingSettings);
router.get("/settings/email", authenticate, authorize("view"), settings.getEmailSettings);
router.put("/settings/email", authenticate, authorize("edit"), settings.updateEmailSettings);
router.get("/seo", authenticate, authorize("view"), settings.listSeo);
router.put("/seo", authenticate, authorize("edit"), settings.upsertSeo);
router.get("/coupons", authenticate, authorize("view"), settings.listCoupons);
router.post("/coupons", authenticate, authorize("create"), settings.createCoupon);
router.put("/coupons/:id", authenticate, authorize("edit"), settings.updateCoupon);
router.delete("/coupons/:id", authenticate, authorize("delete"), settings.deleteCoupon);

// Users & roles
router.get("/users", authenticate, authorize("view"), userCtrl.listUsers);
router.post("/users", authenticate, authorize("create"), userCtrl.createUser);
router.put("/users/:id", authenticate, authorize("edit"), userCtrl.updateUser);

export default router;
