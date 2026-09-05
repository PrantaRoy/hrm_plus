import { z } from "zod";
import { AI_PROVIDERS } from "@hrm-plus/shared";

export const updateAiSettingsSchema = z.object({
  provider: z.enum(AI_PROVIDERS),
  model: z.string().trim().min(1).max(100).nullable().optional(),
  // Optional so an admin can change provider/model without re-entering an already-configured key.
  apiKey: z.string().trim().min(1).max(500).optional(),
});
