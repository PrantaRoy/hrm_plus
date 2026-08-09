import { SiteSettingDto, UpdateSiteSettingInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function getSiteSettings(): Promise<SiteSettingDto> {
  const res = await apiClient.get<SiteSettingDto>("/site-settings");
  return res.data;
}

export async function updateSiteSettings(input: UpdateSiteSettingInput): Promise<SiteSettingDto> {
  const res = await apiClient.patch<SiteSettingDto>("/site-settings", input);
  return res.data;
}

export async function uploadSiteLogo(file: File): Promise<SiteSettingDto> {
  const formData = new FormData();
  formData.append("logo", file);
  const res = await apiClient.post<SiteSettingDto>("/site-settings/logo", formData);
  return res.data;
}

export async function uploadSiteFavicon(file: File): Promise<SiteSettingDto> {
  const formData = new FormData();
  formData.append("favicon", file);
  const res = await apiClient.post<SiteSettingDto>("/site-settings/favicon", formData);
  return res.data;
}
