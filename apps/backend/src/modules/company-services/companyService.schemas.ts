import { z } from "zod";

export const createCompanyServiceSchema = z.object({
  icon: z.string().trim().min(1).max(60),
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(300),
  description: z.string().trim().min(1),
  isActive: z.boolean().default(true),
});

export const updateCompanyServiceSchema = createCompanyServiceSchema.partial();

export const reorderCompanyServicesSchema = z.object({
  orderedIds: z.array(z.number().int()).min(1),
});
