import { z } from "zod";
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
  shortTextCount: number;
}

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;

export async function generateAssessmentQuestions(params: GenerateAssessmentQuestionsParams): Promise<GeneratedQuestion[]> {
  const system =
    "You are an expert technical recruiter designing a pre-screening skills assessment. " +
    'Respond with ONLY a JSON object of the exact shape { "questions": [...] }, no other text.';

  const experienceLine =
    params.minExperienceYears != null || params.maxExperienceYears != null
      ? `Target experience: ${params.minExperienceYears ?? 0}-${params.maxExperienceYears ?? "?"} years.`
      : "";

  const prompt = `Job title: ${params.jobTitle}
Required skills: ${params.skills.join(", ") || "not specified"}
${experienceLine}
Job description: ${params.description}

Generate exactly ${params.mcqCount} multiple-choice questions (each with 4 plausible options, exactly one correct,
"correctOptionIndex" 0-based) and ${params.shortTextCount} short-answer questions that test practical understanding
relevant to this role. Each question object must have the shape:
{"type":"MCQ"|"SHORT_TEXT","prompt":string,"options"?:string[],"correctOptionIndex"?:number,"points":number}
with "points" an integer between 1 and 10. Return exactly ${params.mcqCount + params.shortTextCount} questions total,
ordered MCQ first then SHORT_TEXT.`;

  const raw = await getLlmProvider().generateJson<unknown>({ system, prompt, maxTokens: 3000 });
  const parsed = generatedQuestionsResponseSchema.safeParse(raw);

  if (!parsed.success || parsed.data.questions.length !== params.mcqCount + params.shortTextCount) {
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
