import {
  AttendanceDto,
  AttendanceSettingsDto,
  CheckInInput,
  CheckOutInput,
  EmployeeAttendanceDeviceDto,
  EmployeeAttendanceMethodsDto,
  EmployeeAttendanceRulesDto,
  ListAttendanceItemDto,
  ListAttendanceQuery,
  ManualAttendanceInput,
  SetEmployeeAttendanceMethodsInput,
  SetEmployeeAttendanceRulesInput,
  TodayAttendanceDto,
  UpdateAttendanceSettingsInput,
  WorksheetQuery,
  WorksheetRowDto,
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

export async function getWorksheet(query: WorksheetQuery): Promise<WorksheetRowDto[]> {
  const res = await apiClient.get<WorksheetRowDto[]>("/attendance/worksheet", { params: query });
  return res.data;
}

export async function getMyWorksheet(query: WorksheetQuery): Promise<WorksheetRowDto[]> {
  const res = await apiClient.get<WorksheetRowDto[]>("/attendance/worksheet/my", { params: query });
  return res.data;
}

export async function setManualAttendance(employeeId: number, input: ManualAttendanceInput): Promise<AttendanceDto> {
  const res = await apiClient.put<AttendanceDto>(`/attendance/employees/${employeeId}/manual-entry`, input);
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

export async function getEmployeeAttendanceRules(employeeId: number): Promise<EmployeeAttendanceRulesDto> {
  const res = await apiClient.get<EmployeeAttendanceRulesDto>(`/attendance/employees/${employeeId}/rules`);
  return res.data;
}

export async function setEmployeeAttendanceRules(
  employeeId: number,
  input: SetEmployeeAttendanceRulesInput
): Promise<EmployeeAttendanceRulesDto> {
  const res = await apiClient.put<EmployeeAttendanceRulesDto>(`/attendance/employees/${employeeId}/rules`, input);
  return res.data;
}

export async function listEmployeeAttendanceDevices(employeeId: number): Promise<EmployeeAttendanceDeviceDto[]> {
  const res = await apiClient.get<EmployeeAttendanceDeviceDto[]>(`/attendance/employees/${employeeId}/devices`);
  return res.data;
}

export async function approveAttendanceDevice(employeeId: number, deviceId: number): Promise<EmployeeAttendanceDeviceDto> {
  const res = await apiClient.post<EmployeeAttendanceDeviceDto>(
    `/attendance/employees/${employeeId}/devices/${deviceId}/approve`
  );
  return res.data;
}

export async function rejectAttendanceDevice(employeeId: number, deviceId: number): Promise<EmployeeAttendanceDeviceDto> {
  const res = await apiClient.post<EmployeeAttendanceDeviceDto>(
    `/attendance/employees/${employeeId}/devices/${deviceId}/reject`
  );
  return res.data;
}
