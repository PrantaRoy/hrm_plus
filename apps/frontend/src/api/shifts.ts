import { CreateShiftInput, ShiftDto, UpdateShiftInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listShifts(): Promise<ShiftDto[]> {
  const res = await apiClient.get<ShiftDto[]>("/shifts");
  return res.data;
}

export async function createShift(input: CreateShiftInput): Promise<ShiftDto> {
  const res = await apiClient.post<ShiftDto>("/shifts", input);
  return res.data;
}

export async function updateShift(id: number, input: UpdateShiftInput): Promise<ShiftDto> {
  const res = await apiClient.patch<ShiftDto>(`/shifts/${id}`, input);
  return res.data;
}

export async function deleteShift(id: number): Promise<void> {
  await apiClient.delete(`/shifts/${id}`);
}
