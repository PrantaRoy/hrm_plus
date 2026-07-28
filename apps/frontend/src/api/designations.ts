import { CreateDesignationInput, DesignationDto, UpdateDesignationInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listDesignations(): Promise<DesignationDto[]> {
  const res = await apiClient.get<DesignationDto[]>("/designations");
  return res.data;
}

export async function createDesignation(input: CreateDesignationInput): Promise<DesignationDto> {
  const res = await apiClient.post<DesignationDto>("/designations", input);
  return res.data;
}

export async function updateDesignation(
  id: number,
  input: UpdateDesignationInput
): Promise<DesignationDto> {
  const res = await apiClient.patch<DesignationDto>(`/designations/${id}`, input);
  return res.data;
}

export async function deleteDesignation(id: number): Promise<void> {
  await apiClient.delete(`/designations/${id}`);
}
