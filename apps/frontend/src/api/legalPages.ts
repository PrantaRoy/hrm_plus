import { CreateLegalPageInput, LegalPageDto, UpdateLegalPageInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listLegalPages(): Promise<LegalPageDto[]> {
  const res = await apiClient.get<LegalPageDto[]>("/legal-pages");
  return res.data;
}

export async function getLegalPage(id: number): Promise<LegalPageDto> {
  const res = await apiClient.get<LegalPageDto>(`/legal-pages/${id}`);
  return res.data;
}

export async function createLegalPage(input: CreateLegalPageInput): Promise<LegalPageDto> {
  const res = await apiClient.post<LegalPageDto>("/legal-pages", input);
  return res.data;
}

export async function updateLegalPage(id: number, input: UpdateLegalPageInput): Promise<LegalPageDto> {
  const res = await apiClient.patch<LegalPageDto>(`/legal-pages/${id}`, input);
  return res.data;
}

export async function deleteLegalPage(id: number): Promise<void> {
  await apiClient.delete(`/legal-pages/${id}`);
}
