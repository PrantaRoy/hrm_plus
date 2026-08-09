import { z } from "zod";
import { HERO_MEDIA_TYPES } from "@hrm-plus/shared";
import { multipartBoolean } from "../../utils/zodMultipart";

export const createHeroSlideSchema = z.object({
  headline: z.string().trim().min(1).max(200),
  subHeadline: z.string().trim().max(300).optional(),
  mediaType: z.enum(HERO_MEDIA_TYPES),
  ctaPrimaryText: z.string().trim().max(60).optional(),
  ctaPrimaryUrl: z.string().trim().max(500).optional(),
  ctaSecondaryText: z.string().trim().max(60).optional(),
  ctaSecondaryUrl: z.string().trim().max(500).optional(),
  isActive: multipartBoolean.default(true),
});

export const updateHeroSlideSchema = createHeroSlideSchema.partial();

export const reorderHeroSlidesSchema = z.object({
  orderedIds: z.array(z.number().int()).min(1),
});
