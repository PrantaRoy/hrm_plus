import { z } from "zod";

export const createPackageSchema = z.object({
  name: z.string().trim().min(1),
  price: z.number().min(0),
  validityDays: z.number().int().positive().nullable(),
  isActive: z.boolean().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  features: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
  isPopular: z.boolean().optional(),
  billingPeriod: z.string().trim().max(60).nullable().optional(),
  ctaLabel: z.string().trim().max(60).nullable().optional(),
  sortOrder: z.number().int().min(0).max(99).optional(),
});

export const updatePackageSchema = createPackageSchema.partial();
