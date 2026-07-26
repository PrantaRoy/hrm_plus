import { SaasStats, SaasTenantDto, UpdateSaasTenantInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listSaasTenants(): Promise<SaasTenantDto[]> {
  const res = await apiClient.get<SaasTenantDto[]>("/saas/admin/tenants");
  return res.data;
}

export async function updateSaasTenant(id: number, input: UpdateSaasTenantInput): Promise<SaasTenantDto> {
  const res = await apiClient.patch<SaasTenantDto>(`/saas/admin/tenants/${id}`, input);
  return res.data;
}

export async function toggleTenantStatus(id: number): Promise<SaasTenantDto> {
  const res = await apiClient.post<SaasTenantDto>(`/saas/admin/tenants/${id}/toggle-status`);
  return res.data;
}

export async function getStats(): Promise<SaasStats> {
  const res = await apiClient.get<SaasStats>("/saas/admin/stats");
  return res.data;
}
