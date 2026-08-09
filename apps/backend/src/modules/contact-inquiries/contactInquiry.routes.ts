import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { contactInquiryRateLimiter } from "../../middleware/rateLimiter";
import {
  deleteContactInquiryHandler,
  getContactInquiryHandler,
  listContactInquiriesHandler,
  submitContactInquiryHandler,
  updateContactInquiryStatusHandler,
} from "./contactInquiry.controller";

// Public: no requireAuth, rate-limited. Still mounted behind tenantResolver in app.ts.
export const publicContactInquiryRouter = Router();
publicContactInquiryRouter.post("/", contactInquiryRateLimiter, submitContactInquiryHandler);

export const adminContactInquiryRouter = Router();
adminContactInquiryRouter.use(requireAuth, requireRole("Admin", "HR"));
adminContactInquiryRouter.get("/", listContactInquiriesHandler);
adminContactInquiryRouter.get("/:id", getContactInquiryHandler);
adminContactInquiryRouter.patch("/:id/status", updateContactInquiryStatusHandler);
adminContactInquiryRouter.delete("/:id", deleteContactInquiryHandler);
