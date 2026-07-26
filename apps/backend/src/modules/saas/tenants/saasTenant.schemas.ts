import { z } from "zod";

export const updateSaasTenantSchema = z.object({
  name: z.string().trim().min(1).optional(),
  companyType: z.string().trim().min(1).optional(),
  overview: z.string().trim().min(1).optional(),
  numberOfEmployees: z.number().int().positive().optional(),
  contactEmail: z.string().email().optional(),
});
