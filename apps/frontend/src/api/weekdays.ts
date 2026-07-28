import { CreateWeekDayInput, UpdateWeekDayInput, WeekDayDto } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listWeekDays(): Promise<WeekDayDto[]> {
  const res = await apiClient.get<WeekDayDto[]>("/weekdays");
  return res.data;
}

export async function createWeekDay(input: CreateWeekDayInput): Promise<WeekDayDto> {
  const res = await apiClient.post<WeekDayDto>("/weekdays", input);
  return res.data;
}

export async function updateWeekDay(id: number, input: UpdateWeekDayInput): Promise<WeekDayDto> {
  const res = await apiClient.patch<WeekDayDto>(`/weekdays/${id}`, input);
  return res.data;
}

export async function deleteWeekDay(id: number): Promise<void> {
  await apiClient.delete(`/weekdays/${id}`);
}
