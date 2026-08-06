import { GeneralSettingsDto, UpdateGeneralSettingsInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function getGeneralSettings(): Promise<GeneralSettingsDto> {
  const res = await apiClient.get<GeneralSettingsDto>("/general-settings");
  return res.data;
}

export async function updateGeneralSettings(input: UpdateGeneralSettingsInput): Promise<GeneralSettingsDto> {
  const res = await apiClient.patch<GeneralSettingsDto>("/general-settings", input);
  return res.data;
}

export async function uploadGeneralLogo(file: File): Promise<GeneralSettingsDto> {
  const formData = new FormData();
  formData.append("logo", file);
  const res = await apiClient.post<GeneralSettingsDto>("/general-settings/logo", formData);
  return res.data;
}

export async function uploadGeneralFavicon(file: File): Promise<GeneralSettingsDto> {
  const formData = new FormData();
  formData.append("favicon", file);
  const res = await apiClient.post<GeneralSettingsDto>("/general-settings/favicon", formData);
  return res.data;
}
