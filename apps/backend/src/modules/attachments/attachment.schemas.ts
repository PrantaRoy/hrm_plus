import { z } from "zod";

const idSchema = z.coerce.number().int().positive();

export const ownerIdParamSchema = z.object({ id: idSchema });
export const attachmentIdParamSchema = z.object({ attachmentId: idSchema });
