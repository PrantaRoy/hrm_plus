import { AttendanceLocationDto, CreateAttendanceLocationInput, UpdateAttendanceLocationInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listAttendanceLocations(): Promise<AttendanceLocationDto[]> {
  const res = await apiClient.get<AttendanceLocationDto[]>("/attendance-locations");
  return res.data;
}

export async function getAttendanceLocation(id: number): Promise<AttendanceLocationDto> {
  const res = await apiClient.get<AttendanceLocationDto[]>("/attendance-locations");
  const found = res.data.find((l) => l.id === id);
  if (!found) throw new Error("Location not found");
  return found;
}

export async function createAttendanceLocation(input: CreateAttendanceLocationInput): Promise<AttendanceLocationDto> {
  const res = await apiClient.post<AttendanceLocationDto>("/attendance-locations", input);
  return res.data;
}

export async function updateAttendanceLocation(
  id: number,
  input: UpdateAttendanceLocationInput
): Promise<AttendanceLocationDto> {
  const res = await apiClient.patch<AttendanceLocationDto>(`/attendance-locations/${id}`, input);
  return res.data;
}

export async function deleteAttendanceLocation(id: number): Promise<void> {
  await apiClient.delete(`/attendance-locations/${id}`);
}
