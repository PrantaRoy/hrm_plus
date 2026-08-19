import { z } from "zod";
import { PAY_CYCLE_FREQUENCIES } from "@hrm-plus/shared";

export const createPayCycleSchema = z.object({
  name: z.string().trim().min(1),
  frequency: z.enum(PAY_CYCLE_FREQUENCIES),
});

export const updatePayCycleSchema = z.object({
  name: z.string().trim().min(1).optional(),
  frequency: z.enum(PAY_CYCLE_FREQUENCIES).optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});
