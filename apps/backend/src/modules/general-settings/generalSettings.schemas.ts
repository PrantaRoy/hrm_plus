import { z } from "zod";
import { DATE_FORMATS, TIME_FORMATS } from "@hrm-plus/shared";

export const updateGeneralSettingsSchema = z.object({
  siteTitle: z.string().trim().min(1).max(120).optional(),
  dateFormat: z.enum(DATE_FORMATS).optional(),
  timeFormat: z.enum(TIME_FORMATS).optional(),
  timezone: z.string().trim().min(1).max(100).optional(),
  currency: z.string().trim().min(1).max(10).optional(),
  language: z.string().trim().min(1).max(20).optional(),
  copyrightText: z.string().trim().max(200).nullable().optional(),
});
