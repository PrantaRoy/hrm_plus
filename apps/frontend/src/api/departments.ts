import { CreateDepartmentInput, DepartmentDto, UpdateDepartmentInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listDepartments(): Promise<DepartmentDto[]> {
  const res = await apiClient.get<DepartmentDto[]>("/departments");
  return res.data;
}

export async function createDepartment(input: CreateDepartmentInput): Promise<DepartmentDto> {
  const res = await apiClient.post<DepartmentDto>("/departments", input);
  return res.data;
}

export async function updateDepartment(id: number, input: UpdateDepartmentInput): Promise<DepartmentDto> {
  const res = await apiClient.patch<DepartmentDto>(`/departments/${id}`, input);
  return res.data;
}

export async function deleteDepartment(id: number): Promise<void> {
  await apiClient.delete(`/departments/${id}`);
}
