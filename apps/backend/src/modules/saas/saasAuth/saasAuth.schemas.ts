import { z } from "zod";

export const saasLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
