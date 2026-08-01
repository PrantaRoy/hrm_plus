import { AssignmentStatus, DutyScheduleAssignmentDto } from "./roster";

export const ATTENDANCE_METHODS = ["PressAndHold"] as const;
export type AttendanceMethod = (typeof ATTENDANCE_METHODS)[number];

export interface AttendanceSettingsDto {
  id: number;
  pressAndHoldEnabled: boolean;
  updatedById: number | null;
  updatedAt: string;
}

export interface UpdateAttendanceSettingsInput {
  pressAndHoldEnabled?: boolean;
}

export interface EmployeeAttendanceMethodsDto {
  employeeId: number;
  methods: AttendanceMethod[];
}

export interface SetEmployeeAttendanceMethodsInput {
  methods: AttendanceMethod[];
}

export interface BreakLogDto {
  id: number;
  startAt: string;
  endAt: string | null;
}

export interface AttendanceDto {
  id: number;
  employeeId: number;
  dutyScheduleAssignmentId: number;
  date: string;
  checkInAt: string | null;
  checkInMethod: AttendanceMethod | null;
  isLate: boolean;
  lateReason: string | null;
  checkOutAt: string | null;
  checkOutMethod: AttendanceMethod | null;
  isEarlyCheckout: boolean;
  earlyCheckoutReason: string | null;
  breaks: BreakLogDto[];
}

export interface CheckInInput {
  method: AttendanceMethod;
  reason?: string;
}

export interface CheckOutInput {
  method: AttendanceMethod;
  reason?: string;
}

export interface TodayAttendanceDto {
  assignment: DutyScheduleAssignmentDto | null;
  dutyScheduleName: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  checkinConsiderMinutes: number | null;
  checkoutConsiderMinutes: number | null;
  attendance: AttendanceDto | null;
  isOnBreak: boolean;
  availableMethods: AttendanceMethod[];
  canCheckIn: boolean;
  canCheckOut: boolean;
  canStartBreak: boolean;
  canEndBreak: boolean;
  blockedReason: string | null;
}

export interface ListAttendanceQuery {
  startDate?: string;
  endDate?: string;
  employeeId?: number;
  departmentId?: number;
}

export interface ListAttendanceItemDto {
  id: number;
  employeeId: number;
  employeeName: string | null;
  employeeCode: string | null;
  date: string;
  status: AssignmentStatus;
  dutyScheduleName: string | null;
  checkInAt: string | null;
  isLate: boolean;
  lateReason: string | null;
  checkOutAt: string | null;
  isEarlyCheckout: boolean;
  earlyCheckoutReason: string | null;
  totalBreakMinutes: number;
}
