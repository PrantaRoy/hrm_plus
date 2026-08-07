import { z } from "zod";
import { getLlmProvider } from "./llmProvider.factory";

const gradingResponseSchema = z.object({
  score: z.number(),
  feedback: z.string(),
});

export interface GradeShortTextParams {
  questionPrompt: string;
  answerText: string | null;
  maxPoints: number;
}

export interface GradeShortTextResult {
  pointsAwarded: number;
  feedback: string;
}

export async function gradeShortTextAnswer(params: GradeShortTextParams): Promise<GradeShortTextResult> {
  const system =
    "You are grading a job applicant's short-answer response to a screening question. " +
    `Respond with ONLY JSON {"score": number, "feedback": string}. "score" must be an integer between 0 and ${params.maxPoints} ` +
    'reflecting relevance, correctness and completeness. "feedback" is 1-3 sentences explaining the score, written for a hiring manager, not the candidate.';

  const prompt = `Question: ${params.questionPrompt}\nCandidate's answer: ${params.answerText?.trim() || "(no answer given)"}`;

  const raw = await getLlmProvider().generateJson<unknown>({ system, prompt, maxTokens: 500 });
  const parsed = gradingResponseSchema.safeParse(raw);

  const rawScore = parsed.success ? parsed.data.score : 0;
  const pointsAwarded = Math.min(Math.max(Math.round(rawScore), 0), params.maxPoints);
  const feedback = (parsed.success ? parsed.data.feedback : "Unable to parse AI grading response.").slice(0, 2000);

  return { pointsAwarded, feedback };
}
