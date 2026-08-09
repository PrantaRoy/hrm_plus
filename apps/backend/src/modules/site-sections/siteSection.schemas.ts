import { z } from "zod";

export const updateSiteSectionSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  isEnabled: z.boolean().optional(),
});

export const reorderSiteSectionsSchema = z.object({
  orderedIds: z.array(z.number().int()).min(1),
});
