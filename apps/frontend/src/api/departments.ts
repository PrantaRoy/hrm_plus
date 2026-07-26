import { DepartmentDto } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listDepartments(): Promise<DepartmentDto[]> {
  const res = await apiClient.get<DepartmentDto[]>("/departments");
  return res.data;
}

export async function createDepartment(name: string): Promise<DepartmentDto> {
  const res = await apiClient.post<DepartmentDto>("/departments", { name });
  return res.data;
}
