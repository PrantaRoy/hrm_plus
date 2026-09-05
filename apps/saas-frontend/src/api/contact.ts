import {
  ListSaasContactQuery,
  SaasContactStatus,
  SaasContactSubmissionDto,
  SubmitSaasContactInput,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function submitContact(input: SubmitSaasContactInput): Promise<SaasContactSubmissionDto> {
  const res = await apiClient.post<SaasContactSubmissionDto>("/saas/public/contact", input);
  return res.data;
}

export async function listContactSubmissions(
  query: ListSaasContactQuery = {}
): Promise<SaasContactSubmissionDto[]> {
  const res = await apiClient.get<SaasContactSubmissionDto[]>("/saas/admin/contact", {
    params: query.status ? { status: query.status } : undefined,
  });
  return res.data;
}

export async function getContactSubmission(id: number): Promise<SaasContactSubmissionDto> {
  const res = await apiClient.get<SaasContactSubmissionDto>(`/saas/admin/contact/${id}`);
  return res.data;
}

export async function updateContactSubmissionStatus(
  id: number,
  status: SaasContactStatus
): Promise<SaasContactSubmissionDto> {
  const res = await apiClient.patch<SaasContactSubmissionDto>(`/saas/admin/contact/${id}/status`, {
    status,
  });
  return res.data;
}

export async function deleteContactSubmission(id: number): Promise<void> {
  await apiClient.delete(`/saas/admin/contact/${id}`);
}
