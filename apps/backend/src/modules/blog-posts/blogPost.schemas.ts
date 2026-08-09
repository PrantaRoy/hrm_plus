import { z } from "zod";
import { BLOG_POST_STATUSES } from "@hrm-plus/shared";

export const createBlogPostSchema = z.object({
  title: z.string().trim().min(1).max(200),
  excerpt: z.string().trim().max(500).optional(),
  content: z.string().trim().min(1),
  authorName: z.string().trim().max(120).optional(),
});

export const updateBlogPostSchema = createBlogPostSchema.partial();

export const listBlogPostsQuerySchema = z.object({
  status: z.enum(BLOG_POST_STATUSES).optional(),
});
