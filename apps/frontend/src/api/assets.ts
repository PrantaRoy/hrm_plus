import {
  AssetDto,
  AssignAssetInput,
  CreateAssetInput,
  ListAssetsQuery,
  PaginatedResult,
  ReturnAssetInput,
  UpdateAssetInput,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listAssets(query: ListAssetsQuery = {}): Promise<PaginatedResult<AssetDto>> {
  const res = await apiClient.get<PaginatedResult<AssetDto>>("/assets", { params: query });
  return res.data;
}

export async function getAsset(id: number): Promise<AssetDto> {
  const res = await apiClient.get<AssetDto>(`/assets/${id}`);
  return res.data;
}

export async function createAsset(input: CreateAssetInput): Promise<AssetDto> {
  const res = await apiClient.post<AssetDto>("/assets", input);
  return res.data;
}

export async function updateAsset(id: number, input: UpdateAssetInput): Promise<AssetDto> {
  const res = await apiClient.patch<AssetDto>(`/assets/${id}`, input);
  return res.data;
}

export async function retireAsset(id: number): Promise<AssetDto> {
  const res = await apiClient.post<AssetDto>(`/assets/${id}/retire`);
  return res.data;
}

export async function assignAsset(id: number, input: AssignAssetInput): Promise<AssetDto> {
  const res = await apiClient.post<AssetDto>(`/assets/${id}/assign`, input);
  return res.data;
}

export async function returnAsset(id: number, input: ReturnAssetInput = {}): Promise<AssetDto> {
  const res = await apiClient.post<AssetDto>(`/assets/${id}/return`, input);
  return res.data;
}

export async function listAssetsForEmployee(employeeId: number): Promise<AssetDto[]> {
  const res = await apiClient.get<AssetDto[]>(`/assets/employee/${employeeId}`);
  return res.data;
}

export async function listMyAssets(): Promise<AssetDto[]> {
  const res = await apiClient.get<AssetDto[]>("/assets/my");
  return res.data;
}

export interface OffboardingChecklistResult {
  documentRequestId: number;
  assets: AssetDto[];
}

export async function startOffboardingChecklist(employeeId: number): Promise<OffboardingChecklistResult> {
  const res = await apiClient.post<OffboardingChecklistResult>(
    `/assets/employee/${employeeId}/start-offboarding-checklist`
  );
  return res.data;
}
