import { z } from "zod";

export const createLegalPageSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug must be lowercase letters, numbers, and hyphens"),
  title: z.string().trim().min(1).max(160),
  content: z.string().trim().min(1),
});

export const updateLegalPageSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  content: z.string().trim().min(1).optional(),
});
