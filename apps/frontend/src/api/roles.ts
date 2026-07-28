import { CreateRoleInput, RoleDto, UpdateRoleInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listRoles(): Promise<RoleDto[]> {
  const res = await apiClient.get<RoleDto[]>("/roles");
  return res.data;
}

export async function createRole(input: CreateRoleInput): Promise<RoleDto> {
  const res = await apiClient.post<RoleDto>("/roles", input);
  return res.data;
}

export async function updateRole(id: number, input: UpdateRoleInput): Promise<RoleDto> {
  const res = await apiClient.patch<RoleDto>(`/roles/${id}`, input);
  return res.data;
}

export async function deleteRole(id: number): Promise<void> {
  await apiClient.delete(`/roles/${id}`);
}
