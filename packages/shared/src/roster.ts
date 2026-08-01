export const ROSTER_PERIOD_TYPES = ["Weekly", "Fortnightly", "Monthly"] as const;
export type RosterPeriodType = (typeof ROSTER_PERIOD_TYPES)[number];

export const ROSTER_STATUSES = ["Draft", "Pending", "Approved"] as const;
export type RosterStatus = (typeof ROSTER_STATUSES)[number];

export const ASSIGNMENT_STATUSES = [
  "Scheduled",
  "CheckedIn",
  "Completed",
  "OnLeave",
  "Incomplete",
  "Cancelled",
] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export interface RosterDto {
  id: number;
  departmentId: number;
  departmentName: string | null;
  periodType: RosterPeriodType;
  startDate: string;
  endDate: string;
  status: RosterStatus;
  generatedById: number | null;
  generatedByName: string | null;
  approvedById: number | null;
  approvedByName: string | null;
  approvedAt: string | null;
  createdById: number;
  createdByName: string | null;
  updatedById: number | null;
  updatedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRosterInput {
  departmentId: number;
  periodType: RosterPeriodType;
  startDate: string;
  endDate: string;
}

export type UpdateRosterInput = Partial<Omit<CreateRosterInput, "departmentId">>;

export interface AutoGenerateRosterInput {
  overwriteExisting?: boolean;
}

export interface AutoGenerateRosterResult {
  roster: RosterDto;
  assignmentsCreated: number;
}

export interface DutyScheduleAssignmentDto {
  id: number;
  rosterId: number;
  employeeId: number;
  employeeName: string | null;
  employeeCode: string | null;
  dutyScheduleId: number | null;
  dutyScheduleName: string | null;
  departmentId: number;
  date: string;
  status: AssignmentStatus;
  comment: string | null;
  isLeave: boolean;
  isHoliday: boolean;
  isWeekend: boolean;
  changeRequest: string | null;
  createdById: number;
  updatedById: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssignmentInput {
  employeeId: number;
  dutyScheduleId?: number | null;
  date: string;
  comment?: string | null;
  isLeave?: boolean;
  isHoliday?: boolean;
}

export interface UpdateAssignmentInput {
  employeeId?: number;
  dutyScheduleId?: number | null;
  date?: string;
  status?: AssignmentStatus;
  comment?: string | null;
  isLeave?: boolean;
  isHoliday?: boolean;
  changeRequest?: string | null;
}

export interface ListAssignmentsQuery {
  startDate?: string;
  endDate?: string;
  employeeId?: number;
  departmentId?: number;
}
