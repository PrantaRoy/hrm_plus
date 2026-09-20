import { z } from "zod";
import { COMMENT_STATUSES } from "@hrm-plus/shared";

const idSchema = z.coerce.number().int().positive();

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(10000),
  status: z.enum(COMMENT_STATUSES).nullable().optional(),
});

export const updateCommentSchema = z
  .object({
    body: z.string().trim().min(1).max(10000).optional(),
    status: z.enum(COMMENT_STATUSES).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export const ownerIdParamSchema = z.object({ id: idSchema });
export const commentIdParamSchema = z.object({ commentId: idSchema });
