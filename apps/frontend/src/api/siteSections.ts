import { SiteSectionDto, UpdateSiteSectionInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listSiteSections(): Promise<SiteSectionDto[]> {
  const res = await apiClient.get<SiteSectionDto[]>("/site-sections");
  return res.data;
}

export async function updateSiteSection(id: number, input: UpdateSiteSectionInput): Promise<SiteSectionDto> {
  const res = await apiClient.patch<SiteSectionDto>(`/site-sections/${id}`, input);
  return res.data;
}

export async function reorderSiteSections(orderedIds: number[]): Promise<SiteSectionDto[]> {
  const res = await apiClient.post<SiteSectionDto[]>("/site-sections/reorder", { orderedIds });
  return res.data;
}
