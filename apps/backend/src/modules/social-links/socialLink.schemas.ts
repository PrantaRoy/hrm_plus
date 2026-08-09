import { z } from "zod";

export const createSocialLinkSchema = z.object({
  platform: z.string().trim().min(1).max(60),
  icon: z.string().trim().min(1).max(60),
  url: z.string().trim().url().max(500),
  isActive: z.boolean().default(true),
});

export const updateSocialLinkSchema = createSocialLinkSchema.partial();

export const reorderSocialLinksSchema = z.object({
  orderedIds: z.array(z.number().int()).min(1),
});
