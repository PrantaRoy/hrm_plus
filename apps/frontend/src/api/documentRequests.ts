import {
  DecideDocumentRequestInput,
  DocumentRequestDto,
  DocumentRequestStatus,
  ListDocumentRequestsQuery,
  PaginatedResult,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

export interface CreateDocumentRequestFormInput {
  templateId: number;
  reason?: string;
  priority?: string;
  deadlineDate?: string;
  attachment?: File;
}

export async function listMyDocumentRequests(status?: DocumentRequestStatus): Promise<DocumentRequestDto[]> {
  const res = await apiClient.get<DocumentRequestDto[]>("/document-requests/my", { params: { status } });
  return res.data;
}

export async function listPendingMyApproval(): Promise<DocumentRequestDto[]> {
  const res = await apiClient.get<DocumentRequestDto[]>("/document-requests/pending-my-approval");
  return res.data;
}

export async function listDocumentRequests(
  query: ListDocumentRequestsQuery
): Promise<PaginatedResult<DocumentRequestDto>> {
  const res = await apiClient.get<PaginatedResult<DocumentRequestDto>>("/document-requests", { params: query });
  return res.data;
}

export async function getDocumentRequest(id: number): Promise<DocumentRequestDto> {
  const res = await apiClient.get<DocumentRequestDto>(`/document-requests/${id}`);
  return res.data;
}

export async function createDocumentRequest(input: CreateDocumentRequestFormInput): Promise<DocumentRequestDto> {
  const formData = new FormData();
  formData.append("templateId", String(input.templateId));
  if (input.reason) formData.append("reason", input.reason);
  if (input.priority) formData.append("priority", input.priority);
  if (input.deadlineDate) formData.append("deadlineDate", input.deadlineDate);
  if (input.attachment) formData.append("attachment", input.attachment);
  const res = await apiClient.post<DocumentRequestDto>("/document-requests", formData);
  return res.data;
}

export async function approveDocumentRequest(
  id: number,
  input: DecideDocumentRequestInput = {}
): Promise<DocumentRequestDto> {
  const res = await apiClient.post<DocumentRequestDto>(`/document-requests/${id}/approve`, input);
  return res.data;
}

export async function rejectDocumentRequest(
  id: number,
  input: DecideDocumentRequestInput = {}
): Promise<DocumentRequestDto> {
  const res = await apiClient.post<DocumentRequestDto>(`/document-requests/${id}/reject`, input);
  return res.data;
}

export async function cancelDocumentRequest(id: number): Promise<DocumentRequestDto> {
  const res = await apiClient.post<DocumentRequestDto>(`/document-requests/${id}/cancel`);
  return res.data;
}

export async function retryIssueDocumentRequest(id: number): Promise<DocumentRequestDto> {
  const res = await apiClient.post<DocumentRequestDto>(`/document-requests/${id}/retry-issue`);
  return res.data;
}

export async function updateDocumentRequestFieldValues(
  id: number,
  fieldValues: Record<string, unknown>
): Promise<DocumentRequestDto> {
  const res = await apiClient.patch<DocumentRequestDto>(`/document-requests/${id}/field-values`, { fieldValues });
  return res.data;
}

export async function fetchDocumentRequestPreview(id: number): Promise<Blob> {
  const res = await apiClient.get(`/document-requests/${id}/preview`, { responseType: "blob" });
  return res.data;
}

export async function getDocumentRequestDownloadUrl(id: number): Promise<string> {
  const res = await apiClient.get<{ url: string }>(`/document-requests/${id}/download`);
  return res.data.url;
}
