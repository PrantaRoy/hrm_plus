import { ApplicationDto, ListApplicationsQuery } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listApplications(params: ListApplicationsQuery = {}): Promise<ApplicationDto[]> {
  const res = await apiClient.get<ApplicationDto[]>("/applications", { params });
  return res.data;
}

export async function getApplication(id: number): Promise<ApplicationDto> {
  const res = await apiClient.get<ApplicationDto>(`/applications/${id}`);
  return res.data;
}
