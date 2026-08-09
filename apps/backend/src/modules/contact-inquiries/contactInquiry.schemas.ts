import { z } from "zod";
import { CONTACT_INQUIRY_STATUSES } from "@hrm-plus/shared";

export const submitContactInquirySchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional(),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1).max(5000),
});

export const updateContactInquiryStatusSchema = z.object({
  status: z.enum(CONTACT_INQUIRY_STATUSES),
});

export const listContactInquiriesQuerySchema = z.object({
  status: z.enum(CONTACT_INQUIRY_STATUSES).optional(),
});
