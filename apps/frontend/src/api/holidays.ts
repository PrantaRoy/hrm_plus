import {
  CreateHolidayInput,
  HolidayDto,
  ImportHolidaysInput,
  ImportHolidaysResult,
  ListHolidaysQuery,
  PublishYearResult,
  UpdateHolidayInput,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listHolidays(params: ListHolidaysQuery): Promise<HolidayDto[]> {
  const res = await apiClient.get<HolidayDto[]>("/holidays", { params });
  return res.data;
}

export async function getHoliday(id: number): Promise<HolidayDto> {
  const res = await apiClient.get<HolidayDto>(`/holidays/${id}`);
  return res.data;
}

export async function createHoliday(input: CreateHolidayInput): Promise<HolidayDto> {
  const res = await apiClient.post<HolidayDto>("/holidays", input);
  return res.data;
}

export async function updateHoliday(id: number, input: UpdateHolidayInput): Promise<HolidayDto> {
  const res = await apiClient.patch<HolidayDto>(`/holidays/${id}`, input);
  return res.data;
}

export async function deleteHoliday(id: number): Promise<void> {
  await apiClient.delete(`/holidays/${id}`);
}

export async function publishHoliday(id: number): Promise<HolidayDto> {
  const res = await apiClient.post<HolidayDto>(`/holidays/${id}/publish`);
  return res.data;
}

export async function unpublishHoliday(id: number): Promise<HolidayDto> {
  const res = await apiClient.post<HolidayDto>(`/holidays/${id}/unpublish`);
  return res.data;
}

export async function publishYear(year: number): Promise<PublishYearResult> {
  const res = await apiClient.post<PublishYearResult>("/holidays/publish-year", { year });
  return res.data;
}

export async function importHolidays(input: ImportHolidaysInput): Promise<ImportHolidaysResult> {
  const res = await apiClient.post<ImportHolidaysResult>("/holidays/import", input);
  return res.data;
}

export async function getHolidayCalendar(params: {
  startDate?: string;
  endDate?: string;
}): Promise<HolidayDto[]> {
  const res = await apiClient.get<HolidayDto[]>("/holidays/calendar", { params });
  return res.data;
}
