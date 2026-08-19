import { z } from "zod";
import { BANK_EXPORT_FORMATS, PAYROLL_RUN_STATUSES } from "@hrm-plus/shared";

export const generateDraftPayrollRunSchema = z.object({
  payCycleId: z.number().int(),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  paymentDate: z.string().min(1),
});

export const listPayrollRunsQuerySchema = z.object({
  status: z.enum(PAYROLL_RUN_STATUSES).optional(),
  payCycleId: z.coerce.number().int().optional(),
});

export const decidePayrollRunSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const bankExportQuerySchema = z.object({
  format: z.enum(BANK_EXPORT_FORMATS),
});
