import { SaasStats, SaasTenantDto, SubmitApplicationInput, UpdateSaasTenantInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listSaasTenants(): Promise<SaasTenantDto[]> {
  const res = await apiClient.get<SaasTenantDto[]>("/saas/admin/tenants");
  return res.data;
}

export async function createSaasTenant(
  input: SubmitApplicationInput,
  logo: File | null
): Promise<SaasTenantDto> {
  const form = new FormData();
  form.append("companyName", input.companyName);
  form.append("companyType", input.companyType);
  form.append("overview", input.overview);
  form.append("numberOfEmployees", String(input.numberOfEmployees));
  form.append("contactEmail", input.contactEmail);
  form.append("subdomainSlug", input.subdomainSlug);
  form.append("packageId", String(input.packageId));
  if (logo) {
    form.append("logo", logo);
  }

  const res = await apiClient.post<SaasTenantDto>("/saas/admin/tenants", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
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
