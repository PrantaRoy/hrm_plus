import { z } from "zod";
import { DOCUMENT_TYPES } from "@hrm-plus/shared";

export const createEmployeeDocumentSchema = z.object({
  documentName: z.string().trim().min(1),
  type: z.enum(DOCUMENT_TYPES),
  startDate: z.string().min(1).optional(),
  expiryDate: z.string().min(1).optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});

export const updateEmployeeDocumentSchema = z.object({
  documentName: z.string().trim().min(1).optional(),
  type: z.enum(DOCUMENT_TYPES).optional(),
  startDate: z.string().min(1).nullable().optional(),
  expiryDate: z.string().min(1).nullable().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});
