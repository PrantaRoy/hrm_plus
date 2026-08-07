import { z } from "zod";

export const withdrawApplicationSchema = z.object({
  reason: z.string().trim().min(1).optional(),
});
