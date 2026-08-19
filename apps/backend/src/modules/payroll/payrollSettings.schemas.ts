import { z } from "zod";
import { PAYROLL_REGIONS } from "@hrm-plus/shared";

export const updatePayrollSettingsSchema = z.object({
  overtimeMultiplier: z.number().min(1).max(5).optional(),
  region: z.enum(PAYROLL_REGIONS).optional(),
});
