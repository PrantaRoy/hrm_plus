import {
  AssessmentDto,
  AssessmentInvitationDto,
  CreateOrUpdateAssessmentInput,
  GenerateAssessmentWithAiInput,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function getAssessment(jobId: number): Promise<AssessmentDto> {
  const res = await apiClient.get<AssessmentDto>(`/assessments/${jobId}`);
  return res.data;
}

export async function upsertAssessment(jobId: number, input: CreateOrUpdateAssessmentInput): Promise<AssessmentDto> {
  const res = await apiClient.put<AssessmentDto>(`/assessments/${jobId}`, input);
  return res.data;
}

export async function generateAssessmentWithAi(jobId: number, input: GenerateAssessmentWithAiInput): Promise<AssessmentDto> {
  const res = await apiClient.post<AssessmentDto>(`/assessments/${jobId}/generate-ai`, input);
  return res.data;
}

export async function publishAssessment(jobId: number): Promise<AssessmentDto> {
  const res = await apiClient.post<AssessmentDto>(`/assessments/${jobId}/publish`);
  return res.data;
}

export async function resendAssessmentInvite(applicationId: number): Promise<AssessmentInvitationDto> {
  const res = await apiClient.post<AssessmentInvitationDto>(`/assessments/applications/${applicationId}/resend-invite`);
  return res.data;
}
