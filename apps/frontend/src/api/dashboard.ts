import {
  DashboardCalendarDayDto,
  DashboardCalendarQuery,
  DashboardSummaryDto,
  DashboardTrendsDto,
  DashboardTrendsQuery,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function getDashboardSummary(): Promise<DashboardSummaryDto> {
  const res = await apiClient.get<DashboardSummaryDto>("/dashboard/summary");
  return res.data;
}

export async function getDashboardTrends(params: DashboardTrendsQuery): Promise<DashboardTrendsDto> {
  const res = await apiClient.get<DashboardTrendsDto>("/dashboard/trends", { params });
  return res.data;
}

export async function getDashboardCalendar(params: DashboardCalendarQuery): Promise<DashboardCalendarDayDto[]> {
  const res = await apiClient.get<DashboardCalendarDayDto[]>("/dashboard/calendar", { params });
  return res.data;
}
