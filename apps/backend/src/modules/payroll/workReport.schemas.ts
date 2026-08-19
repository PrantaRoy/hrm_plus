import { z } from "zod";
import { WORK_REPORT_STATUSES } from "@hrm-plus/shared";

export const generateWorkReportsSchema = z.object({
  payCycleId: z.number().int(),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
});

export const listWorkReportsQuerySchema = z.object({
  status: z.enum(WORK_REPORT_STATUSES).optional(),
  employeeId: z.coerce.number().int().optional(),
  payCycleId: z.coerce.number().int().optional(),
});
