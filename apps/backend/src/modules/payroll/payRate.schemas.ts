import { z } from "zod";
import { PAY_RATE_TYPES } from "@hrm-plus/shared";

export const createPayRateSchema = z.object({
  employeeId: z.number().int(),
  rateType: z.enum(PAY_RATE_TYPES),
  baseRate: z.number().min(0),
  effectiveFrom: z.string().min(1),
  effectiveTo: z.string().min(1).optional(),
});
