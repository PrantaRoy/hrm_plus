import {
  AutoGenerateRosterInput,
  AutoGenerateRosterResult,
  CreateAssignmentInput,
  CreateRosterInput,
  DutyScheduleAssignmentDto,
  ListAssignmentsQuery,
  PaginatedResult,
  RosterDto,
  UpdateAssignmentInput,
  UpdateRosterInput,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

export interface ListRostersParams {
  page?: number;
  pageSize?: number;
  departmentId?: number;
  status?: string;
}

export async function listRosters(params: ListRostersParams): Promise<PaginatedResult<RosterDto>> {
  const res = await apiClient.get<PaginatedResult<RosterDto>>("/rosters", { params });
  return res.data;
}

export async function getRoster(id: number): Promise<RosterDto> {
  const res = await apiClient.get<RosterDto>(`/rosters/${id}`);
  return res.data;
}

export async function createRoster(input: CreateRosterInput): Promise<RosterDto> {
  const res = await apiClient.post<RosterDto>("/rosters", input);
  return res.data;
}

export async function updateRoster(id: number, input: UpdateRosterInput): Promise<RosterDto> {
  const res = await apiClient.patch<RosterDto>(`/rosters/${id}`, input);
  return res.data;
}

export async function deleteRoster(id: number): Promise<void> {
  await apiClient.delete(`/rosters/${id}`);
}

export async function autoGenerateRoster(
  id: number,
  input: AutoGenerateRosterInput
): Promise<AutoGenerateRosterResult> {
  const res = await apiClient.post<AutoGenerateRosterResult>(`/rosters/${id}/auto-generate`, input);
  return res.data;
}

export async function approveRoster(id: number): Promise<RosterDto> {
  const res = await apiClient.post<RosterDto>(`/rosters/${id}/approve`);
  return res.data;
}

export async function listAssignments(
  rosterId: number,
  params: ListAssignmentsQuery
): Promise<DutyScheduleAssignmentDto[]> {
  const res = await apiClient.get<DutyScheduleAssignmentDto[]>(`/rosters/${rosterId}/assignments`, { params });
  return res.data;
}

export async function createAssignment(
  rosterId: number,
  input: CreateAssignmentInput
): Promise<DutyScheduleAssignmentDto> {
  const res = await apiClient.post<DutyScheduleAssignmentDto>(`/rosters/${rosterId}/assignments`, input);
  return res.data;
}

export async function updateAssignment(
  rosterId: number,
  assignmentId: number,
  input: UpdateAssignmentInput
): Promise<DutyScheduleAssignmentDto> {
  const res = await apiClient.patch<DutyScheduleAssignmentDto>(
    `/rosters/${rosterId}/assignments/${assignmentId}`,
    input
  );
  return res.data;
}

export async function deleteAssignment(rosterId: number, assignmentId: number): Promise<void> {
  await apiClient.delete(`/rosters/${rosterId}/assignments/${assignmentId}`);
}

export async function getMySchedule(params: { startDate?: string; endDate?: string }): Promise<
  DutyScheduleAssignmentDto[]
> {
  const res = await apiClient.get<DutyScheduleAssignmentDto[]>("/rosters/my-schedule", { params });
  return res.data;
}
