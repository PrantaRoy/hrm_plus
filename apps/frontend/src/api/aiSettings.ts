import { AiSettingsDto, UpdateAiSettingsInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function getAiSettings(): Promise<AiSettingsDto> {
  const res = await apiClient.get<AiSettingsDto>("/ai-settings");
  return res.data;
}

export async function updateAiSettings(input: UpdateAiSettingsInput): Promise<AiSettingsDto> {
  const res = await apiClient.patch<AiSettingsDto>("/ai-settings", input);
  return res.data;
}
