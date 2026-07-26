import { z } from "zod";

export const createPackageSchema = z.object({
  name: z.string().trim().min(1),
  price: z.number().min(0),
  validityDays: z.number().int().positive().nullable(),
  isActive: z.boolean().optional(),
});

export const updatePackageSchema = createPackageSchema.partial();
