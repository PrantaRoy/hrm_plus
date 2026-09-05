import { z } from "zod";
import { PrismaClient } from "../../../generated/tenant";
import { ApiError } from "../../utils/ApiError";
import { getLlmProvider } from "./llmProvider.factory";

const generatedQuestionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("MCQ"),
    prompt: z.string().min(1),
    options: z.array(z.string().min(1)).min(2).max(6),
    correctOptionIndex: z.number().int().min(0),
    points: z.number().int().min(1).max(10),
  }),
  z.object({
    type: z.literal("TRUE_FALSE"),
    prompt: z.string().min(1),
    correctOptionIndex: z.number().int().min(0).max(1), // 0 = True, 1 = False
    points: z.number().int().min(1).max(10),
  }),
  z.object({
    type: z.literal("SHORT_TEXT"),
    prompt: z.string().min(1),
    points: z.number().int().min(1).max(10),
  }),
]);

const generatedQuestionsResponseSchema = z.object({
  questions: z.array(generatedQuestionSchema),
});

export interface GenerateAssessmentQuestionsParams {
  jobTitle: string;
  skills: string[];
  minExperienceYears?: number | null;
  maxExperienceYears?: number | null;
  description: string;
  mcqCount: number;
  trueFalseCount: number;
  shortTextCount: number;
  customPrompt?: string;
}

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;

const MAX_CUSTOM_PROMPT_CHARS = 500;

export async function generateAssessmentQuestions(
  prisma: PrismaClient,
  params: GenerateAssessmentQuestionsParams
): Promise<GeneratedQuestion[]> {
  const totalCount = params.mcqCount + params.trueFalseCount + params.shortTextCount;

  // Kept to one sentence and the prompt below kept terse — minimizes tokens for free-tier providers (Groq).
  const system =
    'You are a recruiter writing a pre-screening skills quiz. Respond with ONLY JSON of the shape { "questions": [...] }, no other text.';

  const experienceLine =
    params.minExperienceYears != null || params.maxExperienceYears != null
      ? `Target experience: ${params.minExperienceYears ?? 0}-${params.maxExperienceYears ?? "?"} years.`
      : "";

  const customPromptLine = params.customPrompt
    ? `Additional guidance from the hiring admin: ${params.customPrompt.replace(/\s+/g, " ").trim().slice(0, MAX_CUSTOM_PROMPT_CHARS)}`
    : "";

  const prompt = `Job title: ${params.jobTitle}
Required skills: ${params.skills.join(", ") || "not specified"}
${experienceLine}
Job description: ${params.description}
${customPromptLine}

Generate exactly ${params.mcqCount} multiple-choice questions (each with 4 plausible options, exactly one correct,
"correctOptionIndex" 0-based), ${params.trueFalseCount} true/false questions ("correctOptionIndex" 0 for True or 1
for False, no "options" field), and ${params.shortTextCount} short-answer questions, all testing practical
understanding relevant to this role. Each question object must have the shape:
{"type":"MCQ"|"TRUE_FALSE"|"SHORT_TEXT","prompt":string,"options"?:string[],"correctOptionIndex"?:number,"points":number}
with "points" an integer between 1 and 10. Return exactly ${totalCount} questions total, ordered MCQ first, then
TRUE_FALSE, then SHORT_TEXT.`;

  const provider = await getLlmProvider(prisma);
  const maxTokens = Math.min(2000, 90 * Math.max(totalCount, 1));
  const raw = await provider.generateJson<unknown>({ system, prompt, maxTokens });
  const parsed = generatedQuestionsResponseSchema.safeParse(raw);

  if (!parsed.success || parsed.data.questions.length !== totalCount) {
    throw ApiError.badRequest(
      "The AI returned an unexpected response. Please try again or author questions manually.",
      "LLM_INVALID_OUTPUT"
    );
  }

  for (const question of parsed.data.questions) {
    if (question.type === "MCQ" && (question.correctOptionIndex < 0 || question.correctOptionIndex >= question.options.length)) {
      throw ApiError.badRequest(
        "The AI returned an unexpected response. Please try again or author questions manually.",
        "LLM_INVALID_OUTPUT"
      );
    }
  }

  return parsed.data.questions;
}
