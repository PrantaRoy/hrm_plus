import { CreateDocumentTemplateInput, DocumentTemplateDto, UpdateDocumentTemplateInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

export interface ListDocumentTemplatesParams {
  categoryId?: number;
  status?: "Active" | "Inactive";
}

export async function listDocumentTemplates(params: ListDocumentTemplatesParams = {}): Promise<DocumentTemplateDto[]> {
  const res = await apiClient.get<DocumentTemplateDto[]>("/document-templates", { params });
  return res.data;
}

export async function getDocumentTemplate(id: number): Promise<DocumentTemplateDto> {
  const res = await apiClient.get<DocumentTemplateDto>(`/document-templates/${id}`);
  return res.data;
}

export async function createDocumentTemplate(input: CreateDocumentTemplateInput): Promise<DocumentTemplateDto> {
  const res = await apiClient.post<DocumentTemplateDto>("/document-templates", input);
  return res.data;
}

export async function updateDocumentTemplate(
  id: number,
  input: UpdateDocumentTemplateInput
): Promise<DocumentTemplateDto> {
  const res = await apiClient.patch<DocumentTemplateDto>(`/document-templates/${id}`, input);
  return res.data;
}

export async function disableDocumentTemplate(id: number): Promise<void> {
  await apiClient.delete(`/document-templates/${id}`);
}
