import { z } from "zod";
import { SAAS_CONTACT_STATUSES } from "@hrm-plus/shared";

export const submitSaasContactSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(160).optional(),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1).max(5000),
});

export const updateSaasContactStatusSchema = z.object({
  status: z.enum(SAAS_CONTACT_STATUSES),
});

export const listSaasContactQuerySchema = z.object({
  status: z.enum(SAAS_CONTACT_STATUSES).optional(),
});
