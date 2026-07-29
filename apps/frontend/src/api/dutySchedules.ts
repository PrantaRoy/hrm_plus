import {
  CreateDutyScheduleInput,
  DutyScheduleDto,
  PaginatedResult,
  UpdateDutyScheduleInput,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

export interface ListDutySchedulesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export async function listDutySchedules(
  params: ListDutySchedulesParams
): Promise<PaginatedResult<DutyScheduleDto>> {
  const res = await apiClient.get<PaginatedResult<DutyScheduleDto>>("/duty-schedules", { params });
  return res.data;
}

export async function getDutySchedule(id: number): Promise<DutyScheduleDto> {
  const res = await apiClient.get<DutyScheduleDto>(`/duty-schedules/${id}`);
  return res.data;
}

export async function createDutySchedule(input: CreateDutyScheduleInput): Promise<DutyScheduleDto> {
  const res = await apiClient.post<DutyScheduleDto>("/duty-schedules", input);
  return res.data;
}

export async function updateDutySchedule(
  id: number,
  input: UpdateDutyScheduleInput
): Promise<DutyScheduleDto> {
  const res = await apiClient.patch<DutyScheduleDto>(`/duty-schedules/${id}`, input);
  return res.data;
}

export async function deleteDutySchedule(id: number): Promise<void> {
  await apiClient.delete(`/duty-schedules/${id}`);
}
