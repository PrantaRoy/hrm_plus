import { z } from "zod";
import { PIPELINE_STAGES } from "@hrm-plus/shared";

export const boardQuerySchema = z.object({
  jobId: z.coerce.number().int(),
});

export const moveApplicationStageSchema = z.object({
  toStage: z.enum(PIPELINE_STAGES),
  note: z.string().trim().min(1).optional(),
  rejectionReason: z.string().trim().min(1).optional(),
});
