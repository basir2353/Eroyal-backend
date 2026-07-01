import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import * as sms from "../controllers/sms.controller.js";

const router = Router();

router.get("/settings/sms", authenticate, authorize("view"), sms.getSmsSettings);
router.put("/settings/sms", authenticate, authorize("edit"), sms.updateSmsSettings);
router.get("/settings/sms/status", authenticate, authorize("view"), sms.getSmsConfigStatus);
router.post("/settings/sms/test", authenticate, authorize("edit"), sms.testSmsDelivery);

export default router;
