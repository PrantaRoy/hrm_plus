import {
  CreateSaasLandingBlockInput,
  ReorderSaasLandingBlocksInput,
  SaasLandingBlockDto,
  SaasLandingBlockType,
  SaasLandingContentDto,
  SaasSiteSettingsDto,
  UpdateSaasLandingBlockInput,
  UpdateSaasSiteSettingsInput,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function getLandingContent(): Promise<SaasLandingContentDto> {
  const res = await apiClient.get<SaasLandingContentDto>("/saas/public/landing-content");
  return res.data;
}

export async function getLandingSettings(): Promise<SaasSiteSettingsDto> {
  const res = await apiClient.get<SaasSiteSettingsDto>("/saas/admin/landing/settings");
  return res.data;
}

export async function updateLandingSettings(
  input: UpdateSaasSiteSettingsInput
): Promise<SaasSiteSettingsDto> {
  const res = await apiClient.patch<SaasSiteSettingsDto>("/saas/admin/landing/settings", input);
  return res.data;
}

export type LandingImageField = "logo" | "favicon" | "heroImage" | "ogImage";

export async function uploadLandingImage(
  field: LandingImageField,
  file: File
): Promise<SaasSiteSettingsDto> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post<SaasSiteSettingsDto>(
    `/saas/admin/landing/settings/images/${field}`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}

export async function listLandingBlocks(
  blockType?: SaasLandingBlockType
): Promise<SaasLandingBlockDto[]> {
  const res = await apiClient.get<SaasLandingBlockDto[]>("/saas/admin/landing/blocks", {
    params: blockType ? { blockType } : undefined,
  });
  return res.data;
}

export async function createLandingBlock(
  input: CreateSaasLandingBlockInput
): Promise<SaasLandingBlockDto> {
  const res = await apiClient.post<SaasLandingBlockDto>("/saas/admin/landing/blocks", input);
  return res.data;
}

export async function updateLandingBlock(
  id: number,
  input: UpdateSaasLandingBlockInput
): Promise<SaasLandingBlockDto> {
  const res = await apiClient.patch<SaasLandingBlockDto>(`/saas/admin/landing/blocks/${id}`, input);
  return res.data;
}

export async function deleteLandingBlock(id: number): Promise<void> {
  await apiClient.delete(`/saas/admin/landing/blocks/${id}`);
}

export async function reorderLandingBlocks(
  input: ReorderSaasLandingBlocksInput
): Promise<SaasLandingBlockDto[]> {
  const res = await apiClient.post<SaasLandingBlockDto[]>(
    "/saas/admin/landing/blocks/reorder",
    input
  );
  return res.data;
}

export async function uploadLandingBlockMedia(id: number, file: File): Promise<SaasLandingBlockDto> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post<SaasLandingBlockDto>(
    `/saas/admin/landing/blocks/${id}/media`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}
