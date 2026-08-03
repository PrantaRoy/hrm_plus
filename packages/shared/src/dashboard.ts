import { LeaveRequestDto, LeaveRequestStatus } from "./leave";

export interface DashboardSummaryDto {
  date: string;
  dutyAssignedToday: number;
  completedToday: number;
  incompleteToday: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  pendingLeaveApprovalsCount: number;
  pendingLeaveApprovalsPreview: LeaveRequestDto[];
}

export interface DashboardTrendsQuery {
  days?: 7 | 30;
}

export interface DashboardTrendPointDto {
  date: string;
  dutyAssigned: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
}

export interface DashboardLeaveStatusCountDto {
  status: LeaveRequestStatus;
  count: number;
}

export interface DashboardTrendsDto {
  startDate: string;
  endDate: string;
  points: DashboardTrendPointDto[];
  leaveStatusBreakdown: DashboardLeaveStatusCountDto[];
}

export interface DashboardCalendarQuery {
  startDate: string;
  endDate: string;
}

export interface DashboardCalendarDayDto {
  date: string;
  isHoliday: boolean;
  holidayName: string | null;
  isWeekend: boolean;
  dutyAssignedCount: number;
}
