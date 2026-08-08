import { z } from "zod";

const baseQuestionFields = {
  prompt: z.string().trim().min(1),
  points: z.number().int().min(1).max(100).default(1),
  sortOrder: z.number().int().optional(),
};

const upsertAssessmentQuestionSchema = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("MCQ"),
      options: z.array(z.string().trim().min(1)).min(2),
      correctOptionIndex: z.number().int().min(0),
      ...baseQuestionFields,
    }),
    z.object({
      type: z.literal("TRUE_FALSE"),
      // Options are always ["True", "False"], fixed server-side — not accepted from the client.
      correctOptionIndex: z.number().int().min(0).max(1),
      ...baseQuestionFields,
    }),
    z.object({
      type: z.literal("MULTIPLE_SELECT"),
      options: z.array(z.string().trim().min(1)).min(2),
      correctOptionIndexes: z.array(z.number().int().min(0)).min(1),
      ...baseQuestionFields,
    }),
    z.object({
      type: z.literal("SHORT_TEXT"),
      ...baseQuestionFields,
    }),
  ])
  .refine((q) => q.type !== "MCQ" || q.correctOptionIndex < q.options.length, {
    message: "correctOptionIndex must be within the options range",
    path: ["correctOptionIndex"],
  })
  .refine((q) => q.type !== "MULTIPLE_SELECT" || q.correctOptionIndexes.every((i) => i < q.options.length), {
    message: "correctOptionIndexes must be within the options range",
    path: ["correctOptionIndexes"],
  })
  .refine((q) => q.type !== "MULTIPLE_SELECT" || new Set(q.correctOptionIndexes).size === q.correctOptionIndexes.length, {
    message: "correctOptionIndexes must not contain duplicates",
    path: ["correctOptionIndexes"],
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
  selectedOptionIndexes: z.array(z.number().int().min(0)).optional(),
  textAnswer: z.string().trim().optional(),
});

export const submitAssessmentAnswersSchema = z.object({
  answers: z.array(submitAssessmentAnswerSchema).min(1),
});
