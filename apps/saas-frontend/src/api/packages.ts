import { CreatePackageInput, PackageDto, UpdatePackageInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listPublicPackages(): Promise<PackageDto[]> {
  const res = await apiClient.get<PackageDto[]>("/saas/public/packages");
  return res.data;
}

export async function listAdminPackages(): Promise<PackageDto[]> {
  const res = await apiClient.get<PackageDto[]>("/saas/admin/packages");
  return res.data;
}

export async function createPackage(input: CreatePackageInput): Promise<PackageDto> {
  const res = await apiClient.post<PackageDto>("/saas/admin/packages", input);
  return res.data;
}

export async function updatePackage(id: number, input: UpdatePackageInput): Promise<PackageDto> {
  const res = await apiClient.patch<PackageDto>(`/saas/admin/packages/${id}`, input);
  return res.data;
}

export async function deletePackage(id: number): Promise<void> {
  await apiClient.delete(`/saas/admin/packages/${id}`);
}
