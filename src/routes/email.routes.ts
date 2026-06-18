import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import * as email from "../controllers/email.controller.js";

const router = Router();

router.get(
  "/settings/email/status",
  authenticate,
  authorize("view"),
  email.getEmailConfigStatus,
);

router.post(
  "/settings/email/test",
  authenticate,
  authorize("edit"),
  email.testEmailDelivery,
);

export default router;
