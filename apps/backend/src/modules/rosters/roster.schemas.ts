import { z } from "zod";
import { ROSTER_PERIOD_TYPES, ROSTER_STATUSES } from "@hrm-plus/shared";

export const listRostersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  departmentId: z.coerce.number().int().optional(),
  status: z.enum(ROSTER_STATUSES).optional(),
});

export const createRosterSchema = z.object({
  departmentId: z.coerce.number().int(),
  periodType: z.enum(ROSTER_PERIOD_TYPES),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export const updateRosterSchema = z.object({
  periodType: z.enum(ROSTER_PERIOD_TYPES).optional(),
  startDate: z.string().min(1).optional(),
  endDate: z.string().min(1).optional(),
});

export const autoGenerateRosterSchema = z.object({
  overwriteExisting: z.boolean().optional().default(false),
});

export const scheduleReportQuerySchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});
