import {
  ReviewApplicationInput,
  SubmitApplicationInput,
  TenantApplicationDto,
  UpdateApplicationInput,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function submitApplication(
  input: SubmitApplicationInput,
  logo: File | null
): Promise<TenantApplicationDto> {
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

  const res = await apiClient.post<TenantApplicationDto>("/saas/public/applications", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function listApplications(status?: string): Promise<TenantApplicationDto[]> {
  const res = await apiClient.get<TenantApplicationDto[]>("/saas/admin/applications", {
    params: status ? { status } : undefined,
  });
  return res.data;
}

export async function getApplication(id: number): Promise<TenantApplicationDto> {
  const res = await apiClient.get<TenantApplicationDto>(`/saas/admin/applications/${id}`);
  return res.data;
}

export async function updateApplication(
  id: number,
  input: UpdateApplicationInput
): Promise<TenantApplicationDto> {
  const res = await apiClient.patch<TenantApplicationDto>(`/saas/admin/applications/${id}`, input);
  return res.data;
}

export async function approveApplication(id: number): Promise<TenantApplicationDto> {
  const res = await apiClient.post<TenantApplicationDto>(`/saas/admin/applications/${id}/approve`);
  return res.data;
}

export async function rejectApplication(
  id: number,
  input: ReviewApplicationInput
): Promise<TenantApplicationDto> {
  const res = await apiClient.post<TenantApplicationDto>(`/saas/admin/applications/${id}/reject`, input);
  return res.data;
}
