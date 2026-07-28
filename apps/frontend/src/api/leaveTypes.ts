import { CreateLeaveTypeInput, LeaveTypeDto, UpdateLeaveTypeInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listLeaveTypes(): Promise<LeaveTypeDto[]> {
  const res = await apiClient.get<LeaveTypeDto[]>("/leave-types");
  return res.data;
}

export async function createLeaveType(input: CreateLeaveTypeInput): Promise<LeaveTypeDto> {
  const res = await apiClient.post<LeaveTypeDto>("/leave-types", input);
  return res.data;
}

export async function updateLeaveType(id: number, input: UpdateLeaveTypeInput): Promise<LeaveTypeDto> {
  const res = await apiClient.patch<LeaveTypeDto>(`/leave-types/${id}`, input);
  return res.data;
}

export async function deleteLeaveType(id: number): Promise<void> {
  await apiClient.delete(`/leave-types/${id}`);
}
