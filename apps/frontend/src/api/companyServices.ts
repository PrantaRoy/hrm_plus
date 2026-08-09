import { CompanyServiceDto, CreateCompanyServiceInput, UpdateCompanyServiceInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listCompanyServices(): Promise<CompanyServiceDto[]> {
  const res = await apiClient.get<CompanyServiceDto[]>("/company-services");
  return res.data;
}

export async function getCompanyService(id: number): Promise<CompanyServiceDto> {
  const res = await apiClient.get<CompanyServiceDto>(`/company-services/${id}`);
  return res.data;
}

export async function createCompanyService(input: CreateCompanyServiceInput): Promise<CompanyServiceDto> {
  const res = await apiClient.post<CompanyServiceDto>("/company-services", input);
  return res.data;
}

export async function updateCompanyService(id: number, input: UpdateCompanyServiceInput): Promise<CompanyServiceDto> {
  const res = await apiClient.patch<CompanyServiceDto>(`/company-services/${id}`, input);
  return res.data;
}

export async function deleteCompanyService(id: number): Promise<void> {
  await apiClient.delete(`/company-services/${id}`);
}

export async function reorderCompanyServices(orderedIds: number[]): Promise<CompanyServiceDto[]> {
  const res = await apiClient.post<CompanyServiceDto[]>("/company-services/reorder", { orderedIds });
  return res.data;
}
