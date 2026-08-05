import { z } from "zod";
import { DOCUMENT_PRIORITIES, DOCUMENT_REQUEST_STATUSES } from "@hrm-plus/shared";

export const createDocumentRequestSchema = z.object({
  templateId: z.coerce.number().int(),
  reason: z.string().trim().optional(),
  priority: z.enum(DOCUMENT_PRIORITIES).optional(),
  deadlineDate: z.string().min(1).optional(),
});

export const decideDocumentRequestSchema = z.object({
  comment: z.string().trim().optional(),
});

export const updateFieldValuesSchema = z.object({
  fieldValues: z.record(z.string(), z.unknown()),
});

export const listMyDocumentRequestsQuerySchema = z.object({
  status: z.enum(DOCUMENT_REQUEST_STATUSES).optional(),
});

export const listDocumentRequestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(DOCUMENT_REQUEST_STATUSES).optional(),
  employeeId: z.coerce.number().int().optional(),
  templateId: z.coerce.number().int().optional(),
  categoryId: z.coerce.number().int().optional(),
});
