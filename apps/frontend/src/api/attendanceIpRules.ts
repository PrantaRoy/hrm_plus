import { AttendanceIpRuleDto, CreateAttendanceIpRuleInput, UpdateAttendanceIpRuleInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listAttendanceIpRules(): Promise<AttendanceIpRuleDto[]> {
  const res = await apiClient.get<AttendanceIpRuleDto[]>("/attendance-ip-rules");
  return res.data;
}

export async function createAttendanceIpRule(input: CreateAttendanceIpRuleInput): Promise<AttendanceIpRuleDto> {
  const res = await apiClient.post<AttendanceIpRuleDto>("/attendance-ip-rules", input);
  return res.data;
}

export async function updateAttendanceIpRule(id: number, input: UpdateAttendanceIpRuleInput): Promise<AttendanceIpRuleDto> {
  const res = await apiClient.patch<AttendanceIpRuleDto>(`/attendance-ip-rules/${id}`, input);
  return res.data;
}

export async function deleteAttendanceIpRule(id: number): Promise<void> {
  await apiClient.delete(`/attendance-ip-rules/${id}`);
}
