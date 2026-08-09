import { z } from "zod";

const businessHourEntrySchema = z.object({
  day: z.string().trim().min(1),
  openTime: z.string().trim().min(1),
  closeTime: z.string().trim().min(1),
  isClosed: z.boolean(),
});

export const updateSiteSettingSchema = z.object({
  siteTitle: z.string().trim().min(1).max(120).optional(),
  tagline: z.string().trim().max(200).nullable().optional(),
  primaryColor: z.string().trim().min(1).max(20).optional(),
  secondaryColor: z.string().trim().min(1).max(20).optional(),
  contactEmail: z.string().trim().email().max(160).nullable().optional(),
  contactPhone: z.string().trim().max(40).nullable().optional(),
  contactAddress: z.string().trim().max(2000).nullable().optional(),
  businessHours: z.array(businessHourEntrySchema).nullable().optional(),
  aboutHeading: z.string().trim().max(200).nullable().optional(),
  aboutContent: z.string().trim().max(20000).nullable().optional(),
  metaDescription: z.string().trim().max(500).nullable().optional(),
});
