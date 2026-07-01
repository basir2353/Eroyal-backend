import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import * as order from "../controllers/order.controller.js";
import { createOrderSchema } from "../validators/order.validator.js";
import { upload } from "../controllers/media.controller.js";

const router = Router();

router.post("/public/orders", validateBody(createOrderSchema), order.createPublicOrder);
router.post(
  "/public/orders/:id/payment-receipt",
  upload.single("receipt"),
  order.uploadPaymentReceipt,
);

router.get("/orders", authenticate, authorize("view"), order.listOrders);
router.get(
  "/orders/payment-verifications",
  authenticate,
  authorize("view"),
  order.listPaymentVerifications,
);
router.get("/orders/:id", authenticate, authorize("view"), order.getOrder);
router.patch(
  "/orders/:id/status",
  authenticate,
  authorize("edit"),
  order.updateOrderStatus,
);
router.patch(
  "/orders/:id/payment-complete",
  authenticate,
  authorize("edit"),
  order.completeOrderPayment,
);

router.post(
  "/orders/:id/resend-confirmation",
  authenticate,
  authorize("edit"),
  order.resendOrderConfirmation,
);

export default router;
