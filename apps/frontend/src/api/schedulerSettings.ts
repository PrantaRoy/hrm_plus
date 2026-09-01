import { SchedulerSettingsDto, UpdateSchedulerSettingsInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function getSchedulerSettings(): Promise<SchedulerSettingsDto> {
  const res = await apiClient.get<SchedulerSettingsDto>("/scheduler-settings");
  return res.data;
}

export async function updateSchedulerSettings(
  input: UpdateSchedulerSettingsInput
): Promise<SchedulerSettingsDto> {
  const res = await apiClient.patch<SchedulerSettingsDto>("/scheduler-settings", input);
  return res.data;
}
