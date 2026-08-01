import {
  AttendanceSettingsDto,
  CheckInInput,
  CheckOutInput,
  EmployeeAttendanceMethodsDto,
  ListAttendanceItemDto,
  ListAttendanceQuery,
  SetEmployeeAttendanceMethodsInput,
  TodayAttendanceDto,
  UpdateAttendanceSettingsInput,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function getTodayAttendance(): Promise<TodayAttendanceDto> {
  const res = await apiClient.get<TodayAttendanceDto>("/attendance/today");
  return res.data;
}

export async function checkIn(input: CheckInInput): Promise<TodayAttendanceDto> {
  const res = await apiClient.post<TodayAttendanceDto>("/attendance/check-in", input);
  return res.data;
}

export async function checkOut(input: CheckOutInput): Promise<TodayAttendanceDto> {
  const res = await apiClient.post<TodayAttendanceDto>("/attendance/check-out", input);
  return res.data;
}

export async function startBreak(): Promise<TodayAttendanceDto> {
  const res = await apiClient.post<TodayAttendanceDto>("/attendance/breaks/start");
  return res.data;
}

export async function endBreak(): Promise<TodayAttendanceDto> {
  const res = await apiClient.post<TodayAttendanceDto>("/attendance/breaks/end");
  return res.data;
}

export async function listMyAttendance(query: ListAttendanceQuery): Promise<ListAttendanceItemDto[]> {
  const res = await apiClient.get<ListAttendanceItemDto[]>("/attendance/my", { params: query });
  return res.data;
}

export async function listAttendance(query: ListAttendanceQuery): Promise<ListAttendanceItemDto[]> {
  const res = await apiClient.get<ListAttendanceItemDto[]>("/attendance", { params: query });
  return res.data;
}

export async function getAttendanceSettings(): Promise<AttendanceSettingsDto> {
  const res = await apiClient.get<AttendanceSettingsDto>("/attendance/settings");
  return res.data;
}

export async function updateAttendanceSettings(input: UpdateAttendanceSettingsInput): Promise<AttendanceSettingsDto> {
  const res = await apiClient.patch<AttendanceSettingsDto>("/attendance/settings", input);
  return res.data;
}

export async function getEmployeeAttendanceMethods(employeeId: number): Promise<EmployeeAttendanceMethodsDto> {
  const res = await apiClient.get<EmployeeAttendanceMethodsDto>(`/attendance/employees/${employeeId}/methods`);
  return res.data;
}

export async function setEmployeeAttendanceMethods(
  employeeId: number,
  input: SetEmployeeAttendanceMethodsInput
): Promise<EmployeeAttendanceMethodsDto> {
  const res = await apiClient.put<EmployeeAttendanceMethodsDto>(`/attendance/employees/${employeeId}/methods`, input);
  return res.data;
}
