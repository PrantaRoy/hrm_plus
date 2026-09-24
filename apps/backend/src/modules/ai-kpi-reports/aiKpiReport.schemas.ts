import { z } from "zod";
import { AI_KPI_PERIOD_TYPES, AI_KPI_SCOPE_TYPES } from "@hrm-plus/shared";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const generateAiKpiReportSchema = z
  .object({
    scope: z.object({
      type: z.enum(AI_KPI_SCOPE_TYPES),
      id: z.number().int().positive(),
    }),
    period: z.object({
      type: z.enum(AI_KPI_PERIOD_TYPES),
      startDate: dateString.optional(),
      endDate: dateString.optional(),
    }),
  })
  .refine((v) => v.period.type !== "CUSTOM" || (v.period.startDate && v.period.endDate), {
    message: "Custom period requires startDate and endDate",
    path: ["period"],
  });

export const listAiKpiReportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
