import {
  CreateScreeningQuestionInput,
  ListScreeningQuestionsQuery,
  ScreeningQuestionDto,
  SeedLegalComplianceQuestionsResult,
  UpdateScreeningQuestionInput,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listScreeningQuestions(params: ListScreeningQuestionsQuery = {}): Promise<ScreeningQuestionDto[]> {
  const res = await apiClient.get<ScreeningQuestionDto[]>("/screening-questions", { params });
  return res.data;
}

export async function createScreeningQuestion(input: CreateScreeningQuestionInput): Promise<ScreeningQuestionDto> {
  const res = await apiClient.post<ScreeningQuestionDto>("/screening-questions", input);
  return res.data;
}

export async function updateScreeningQuestion(id: number, input: UpdateScreeningQuestionInput): Promise<ScreeningQuestionDto> {
  const res = await apiClient.patch<ScreeningQuestionDto>(`/screening-questions/${id}`, input);
  return res.data;
}

export async function deleteScreeningQuestion(id: number): Promise<void> {
  await apiClient.delete(`/screening-questions/${id}`);
}

export async function seedLegalComplianceQuestions(): Promise<SeedLegalComplianceQuestionsResult> {
  const res = await apiClient.post<SeedLegalComplianceQuestionsResult>("/screening-questions/seed-legal-compliance");
  return res.data;
}
