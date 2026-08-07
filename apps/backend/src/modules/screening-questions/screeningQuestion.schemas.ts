import { z } from "zod";
import { SCREENING_QUESTION_CATEGORIES, SCREENING_QUESTION_STATUSES, SCREENING_QUESTION_TYPES } from "@hrm-plus/shared";

export const createScreeningQuestionSchema = z.object({
  text: z.string().trim().min(1),
  type: z.enum(SCREENING_QUESTION_TYPES),
  options: z.array(z.string().trim().min(1)).optional(),
});

export const updateScreeningQuestionSchema = z.object({
  text: z.string().trim().min(1).optional(),
  type: z.enum(SCREENING_QUESTION_TYPES).optional(),
  options: z.array(z.string().trim().min(1)).optional(),
  status: z.enum(SCREENING_QUESTION_STATUSES).optional(),
});

export const listScreeningQuestionsQuerySchema = z.object({
  category: z.enum(SCREENING_QUESTION_CATEGORIES).optional(),
  status: z.enum(SCREENING_QUESTION_STATUSES).optional(),
});
