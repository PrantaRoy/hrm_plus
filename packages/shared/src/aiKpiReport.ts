import type { PaginatedResult } from "./employee";

export const AI_KPI_SCOPE_TYPES = ["EMPLOYEE", "DEPARTMENT", "DESIGNATION"] as const;
export type AiKpiScopeType = (typeof AI_KPI_SCOPE_TYPES)[number];

export const AI_KPI_PERIOD_TYPES = ["LAST_2_WEEKS", "LAST_4_WEEKS", "CUSTOM"] as const;
export type AiKpiPeriodType = (typeof AI_KPI_PERIOD_TYPES)[number];

export const AI_KPI_RATINGS = ["EXCELLENT", "GOOD", "NEEDS_ATTENTION", "CRITICAL"] as const;
export type AiKpiRating = (typeof AI_KPI_RATINGS)[number];

export const AI_KPI_MAX_CUSTOM_DAYS = 366;

export interface GenerateAiKpiReportInput {
  scope: { type: AiKpiScopeType; id: number };
  period: { type: AiKpiPeriodType; startDate?: string; endDate?: string };
}

// --- Metrics (computed deterministically by the backend, never by the LLM) ---

export interface AttendanceKpiTotals {
  scheduledDays: number; // working days on the roster (excludes leave/holiday/weekend/cancelled)
  presentDays: number;
  absentDays: number;
  lateCount: number;
  averageLateMinutes: number;
  earlyCheckoutCount: number;
  workedMinutes: number;
  overtimeMinutes: number;
  attendanceRate: number | null; // presentDays / scheduledDays, 0-100
}

export interface AttendanceKpiEmployeeRow extends AttendanceKpiTotals {
  employeeId: number;
  employeeName: string;
}

export interface AttendanceKpiMetrics {
  totals: AttendanceKpiTotals;
  employees: AttendanceKpiEmployeeRow[];
}

export interface LeaveKpiTotals {
  requestCount: number;
  approvedRequests: number;
  pendingRequests: number;
  rejectedRequests: number;
  cancelledRequests: number;
  approvedDays: number; // days inside the period only
  pendingDays: number;
  daysByLeaveType: Array<{ leaveTypeName: string; days: number }>;
  remainingBalanceDays: number; // sum of allocatedDays - daysUsed for the period's year(s)
}

export interface LeaveKpiEmployeeRow {
  employeeId: number;
  employeeName: string;
  approvedRequests: number;
  approvedDays: number;
  pendingDays: number;
  remainingBalanceDays: number;
}

export interface LeaveKpiMetrics {
  totals: LeaveKpiTotals;
  employees: LeaveKpiEmployeeRow[];
}

export interface TaskKpiTotals {
  dueInPeriod: number;
  completedOnTime: number;
  completedLate: number;
  overdueOpen: number; // past due date and still open
  openNotYetDue: number;
  onTimeRate: number | null; // completedOnTime / (completedOnTime + completedLate + overdueOpen), 0-100
  averageOpenProgress: number | null;
  hoursLogged: number;
}

export interface TaskKpiEmployeeRow extends TaskKpiTotals {
  employeeId: number;
  employeeName: string;
}

export interface TaskKpiMetrics {
  totals: TaskKpiTotals;
  employees: TaskKpiEmployeeRow[];
}

export interface AiKpiMetrics {
  attendance: AttendanceKpiMetrics;
  leave: LeaveKpiMetrics;
  task: TaskKpiMetrics;
}

// --- LLM-written narrative ---

export interface AiKpiSectionImpression {
  rating: AiKpiRating;
  summary: string;
  highlights: string[];
  concerns: string[];
}

export interface AiKpiImpression {
  attendance: AiKpiSectionImpression;
  leave: AiKpiSectionImpression;
  task: AiKpiSectionImpression;
  overall: AiKpiSectionImpression;
}

export interface AiKpiReportDto {
  id: number;
  scopeType: AiKpiScopeType;
  scopeId: number;
  scopeLabel: string;
  periodType: AiKpiPeriodType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  employeeCount: number;
  metrics: AiKpiMetrics;
  impression: AiKpiImpression;
  provider: string;
  model: string;
  generatedByEmail: string | null;
  createdAt: string;
}

export interface AiKpiReportListItemDto {
  id: number;
  scopeType: AiKpiScopeType;
  scopeLabel: string;
  periodType: AiKpiPeriodType;
  startDate: string;
  endDate: string;
  employeeCount: number;
  overallRating: AiKpiRating;
  createdAt: string;
}

export interface ListAiKpiReportsQuery {
  page?: number;
  pageSize?: number;
}

export type AiKpiReportPaginatedResult = PaginatedResult<AiKpiReportListItemDto>;
