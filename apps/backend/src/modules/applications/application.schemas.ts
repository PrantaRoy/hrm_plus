import { z } from "zod";
import { PIPELINE_STAGES } from "@hrm-plus/shared";

const applicationAnswerInputSchema = z.object({
  jobScreeningQuestionId: z.number().int(),
  answerText: z.string().trim().optional(),
  answerOptions: z.array(z.string().trim().min(1)).optional(),
});

export const submitApplicationSchema = z.object({
  fullName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phoneNumber: z.string().trim().min(1).optional(),
  coverLetter: z.string().trim().optional(),
  answers: z.array(applicationAnswerInputSchema).default([]),
});

export const listApplicationsQuerySchema = z.object({
  jobId: z.coerce.number().int().optional(),
  stage: z.enum(PIPELINE_STAGES).optional(),
});
