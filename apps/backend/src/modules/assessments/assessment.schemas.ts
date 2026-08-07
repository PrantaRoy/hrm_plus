import { z } from "zod";
import { ASSESSMENT_QUESTION_TYPES } from "@hrm-plus/shared";

const upsertAssessmentQuestionSchema = z
  .object({
    type: z.enum(ASSESSMENT_QUESTION_TYPES),
    prompt: z.string().trim().min(1),
    options: z.array(z.string().trim().min(1)).optional(),
    correctOptionIndex: z.number().int().min(0).optional(),
    points: z.number().int().min(1).max(100).default(1),
    sortOrder: z.number().int().optional(),
  })
  .refine((q) => q.type !== "MCQ" || (q.options && q.options.length >= 2), {
    message: "MCQ questions require at least 2 options",
    path: ["options"],
  })
  .refine((q) => q.type !== "MCQ" || (q.correctOptionIndex !== undefined && q.correctOptionIndex >= 0), {
    message: "MCQ questions require a correctOptionIndex",
    path: ["correctOptionIndex"],
  });

export const createOrUpdateAssessmentSchema = z.object({
  title: z.string().trim().min(1).optional(),
  instructions: z.string().trim().optional(),
  passThresholdPercent: z.number().int().min(0).max(100).optional(),
  questions: z.array(upsertAssessmentQuestionSchema).min(1),
});

export const generateAssessmentWithAiSchema = z.object({
  mcqCount: z.number().int().min(0).max(20),
  shortTextCount: z.number().int().min(0).max(20),
  passThresholdPercent: z.number().int().min(0).max(100).optional(),
});

const submitAssessmentAnswerSchema = z.object({
  questionId: z.number().int(),
  selectedOptionIndex: z.number().int().min(0).optional(),
  textAnswer: z.string().trim().optional(),
});

export const submitAssessmentAnswersSchema = z.object({
  answers: z.array(submitAssessmentAnswerSchema).min(1),
});
