import { z } from "zod";
import { SAAS_BLOG_POST_STATUSES } from "@hrm-plus/shared";

export const createSaasBlogPostSchema = z.object({
  title: z.string().trim().min(1).max(200),
  excerpt: z.string().trim().max(500).nullable().optional(),
  contentMarkdown: z.string().min(1).max(100_000),
  authorName: z.string().trim().max(120).nullable().optional(),
  metaDescription: z.string().trim().max(500).nullable().optional(),
});

export const updateSaasBlogPostSchema = createSaasBlogPostSchema.partial();

export const listSaasBlogPostsQuerySchema = z.object({
  status: z.enum(SAAS_BLOG_POST_STATUSES).optional(),
});
