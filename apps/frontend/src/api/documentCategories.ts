import { DocumentCategoryDto } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listDocumentCategories(): Promise<DocumentCategoryDto[]> {
  const res = await apiClient.get<DocumentCategoryDto[]>("/document-categories");
  return res.data;
}
