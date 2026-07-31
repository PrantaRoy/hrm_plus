import {
  CreateLeaveRequestInput,
  DecideLeaveRequestInput,
  EmployeeLeaveAllocationDto,
  LeaveRequestDto,
  LeaveRequestStatus,
  ListLeaveRequestsQuery,
  PaginatedResult,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listMyLeaveRequests(status?: LeaveRequestStatus): Promise<LeaveRequestDto[]> {
  const res = await apiClient.get<LeaveRequestDto[]>("/leave-requests/my", { params: { status } });
  return res.data;
}

export async function listMyAllocations(): Promise<EmployeeLeaveAllocationDto[]> {
  const res = await apiClient.get<EmployeeLeaveAllocationDto[]>("/leave-requests/my-allocations");
  return res.data;
}

export async function listPendingMyApproval(): Promise<LeaveRequestDto[]> {
  const res = await apiClient.get<LeaveRequestDto[]>("/leave-requests/pending-my-approval");
  return res.data;
}

export async function listLeaveRequests(query: ListLeaveRequestsQuery): Promise<PaginatedResult<LeaveRequestDto>> {
  const res = await apiClient.get<PaginatedResult<LeaveRequestDto>>("/leave-requests", { params: query });
  return res.data;
}

export async function getLeaveRequest(id: number): Promise<LeaveRequestDto> {
  const res = await apiClient.get<LeaveRequestDto>(`/leave-requests/${id}`);
  return res.data;
}

export async function createLeaveRequest(input: CreateLeaveRequestInput): Promise<LeaveRequestDto> {
  const res = await apiClient.post<LeaveRequestDto>("/leave-requests", input);
  return res.data;
}

export async function approveLeaveRequest(id: number, input: DecideLeaveRequestInput = {}): Promise<LeaveRequestDto> {
  const res = await apiClient.post<LeaveRequestDto>(`/leave-requests/${id}/approve`, input);
  return res.data;
}

export async function rejectLeaveRequest(id: number, input: DecideLeaveRequestInput = {}): Promise<LeaveRequestDto> {
  const res = await apiClient.post<LeaveRequestDto>(`/leave-requests/${id}/reject`, input);
  return res.data;
}

export async function cancelLeaveRequest(id: number): Promise<LeaveRequestDto> {
  const res = await apiClient.post<LeaveRequestDto>(`/leave-requests/${id}/cancel`);
  return res.data;
}
