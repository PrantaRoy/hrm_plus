import { CreateLeaveAllocationInput, EmployeeLeaveAllocationDto, UpdateLeaveAllocationInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listLeaveAllocations(employeeId: number): Promise<EmployeeLeaveAllocationDto[]> {
  const res = await apiClient.get<EmployeeLeaveAllocationDto[]>(`/employees/${employeeId}/leave-allocations`);
  return res.data;
}

export async function createLeaveAllocation(
  employeeId: number,
  input: CreateLeaveAllocationInput
): Promise<EmployeeLeaveAllocationDto> {
  const res = await apiClient.post<EmployeeLeaveAllocationDto>(
    `/employees/${employeeId}/leave-allocations`,
    input
  );
  return res.data;
}

export async function updateLeaveAllocation(
  employeeId: number,
  allocationId: number,
  input: UpdateLeaveAllocationInput
): Promise<EmployeeLeaveAllocationDto> {
  const res = await apiClient.patch<EmployeeLeaveAllocationDto>(
    `/employees/${employeeId}/leave-allocations/${allocationId}`,
    input
  );
  return res.data;
}

export async function deleteLeaveAllocation(employeeId: number, allocationId: number): Promise<void> {
  await apiClient.delete(`/employees/${employeeId}/leave-allocations/${allocationId}`);
}
