import { AssignmentStatus, DutyScheduleAssignmentDto } from "./roster";
import { SettingStatus } from "./employee";

export const ATTENDANCE_METHODS = ["PressAndHold", "QrCode"] as const;
export type AttendanceMethod = (typeof ATTENDANCE_METHODS)[number];

export interface AttendanceSettingsDto {
  id: number;
  pressAndHoldEnabled: boolean;
  qrCodeEnabled: boolean;
  updatedById: number | null;
  updatedAt: string;
}

export interface UpdateAttendanceSettingsInput {
  pressAndHoldEnabled?: boolean;
  qrCodeEnabled?: boolean;
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
  isManualEntry: boolean;
  manualEntryNote: string | null;
  breaks: BreakLogDto[];
}

export interface ManualAttendanceInput {
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  note?: string;
}

export interface CheckInInput {
  method: AttendanceMethod;
  reason?: string;
  deviceToken?: string;
  latitude?: number;
  longitude?: number;
  qrToken?: string;
}

export interface CheckOutInput {
  method: AttendanceMethod;
  reason?: string;
  deviceToken?: string;
  latitude?: number;
  longitude?: number;
  qrToken?: string;
}

export interface AttendanceQrKioskSessionDto {
  id: number;
  label: string | null;
  createdAt: string;
}

export interface CreateAttendanceQrKioskSessionInput {
  label?: string;
}

export interface AttendanceQrTokenDto {
  token: string;
  expiresAt: string;
  qrImageDataUri: string;
}

export interface AttendanceQrStaticTokenDto {
  token: string;
  qrImageDataUri: string;
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
  canResumeAfterCheckout: boolean;
  requiresLocationBinding: boolean;
  requiresIpBinding: boolean;
  blockedReason: string | null;
}

export interface AttendanceIpRuleDto {
  id: number;
  label: string;
  cidr: string;
  status: SettingStatus;
}

export interface CreateAttendanceIpRuleInput {
  label: string;
  cidr: string;
  status?: SettingStatus;
}

export type UpdateAttendanceIpRuleInput = Partial<CreateAttendanceIpRuleInput>;

export interface AttendanceLocationDto {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  status: SettingStatus;
}

export interface CreateAttendanceLocationInput {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  status?: SettingStatus;
}

export type UpdateAttendanceLocationInput = Partial<CreateAttendanceLocationInput>;

export const ATTENDANCE_DEVICE_STATUSES = ["Pending", "Approved", "Rejected"] as const;
export type AttendanceDeviceStatus = (typeof ATTENDANCE_DEVICE_STATUSES)[number];

export interface EmployeeAttendanceDeviceDto {
  id: number;
  employeeId: number;
  deviceToken: string;
  label: string | null;
  status: AttendanceDeviceStatus;
  lastSeenAt: string | null;
  lastSeenIp: string | null;
  requestedAt: string;
  approvedAt: string | null;
}

export interface EmployeeAttendanceRulesDto {
  employeeId: number;
  ipBindingEnabled: boolean;
  locationBindingEnabled: boolean;
  deviceBindingEnabled: boolean;
  ipRuleIds: number[];
  locationIds: number[];
}

export interface SetEmployeeAttendanceRulesInput {
  ipBindingEnabled: boolean;
  locationBindingEnabled: boolean;
  deviceBindingEnabled: boolean;
  ipRuleIds: number[];
  locationIds: number[];
}

export interface ListAttendanceQuery {
  startDate?: string;
  endDate?: string;
  employeeId?: number;
  departmentId?: number;
  dutyScheduleId?: number;
}

export interface WorksheetQuery {
  startDate: string;
  endDate: string;
  employeeId?: number;
  departmentId?: number;
}

export interface WorksheetRowDto {
  employeeId: number;
  employeeName: string;
  employeeCode: string | null;
  departmentName: string | null;
  daysPresent: number;
  totalMinutes: number;
  totalBreakMinutes: number;
  workingMinutes: number;
}

export interface ShiftAttendanceLogQuery {
  startDate?: string;
  endDate?: string;
}

export interface ShiftAttendanceLogEntryDto {
  employeeId: number;
  employeeName: string | null;
  employeeCode: string | null;
  date: string;
  status: AssignmentStatus;
  isLeave: boolean;
  isHoliday: boolean;
  isWeekend: boolean;
  checkInAt: string | null;
  checkOutAt: string | null;
  /** Minutes checked in after the scheduled start (0 if on time or not checked in). */
  lateMinutes: number;
  /** True when checkInAt falls after the shift's own scheduled end — likely a wrong-day
   * manual entry rather than a genuine late arrival for this shift. lateMinutes is still
   * populated (raw diff) but should be shown as "Anomalous", not "Late Xh Ym". */
  isAnomalousLate: boolean;
  /** Minutes checked out before the scheduled end (0 otherwise). */
  earlyLeaveMinutes: number;
  /** Minutes worked past the scheduled end (0 otherwise). */
  overtimeMinutes: number;
  lateReason: string | null;
  earlyCheckoutReason: string | null;
  totalBreakMinutes: number;
  isManualEntry: boolean;
}

export interface ShiftAttendanceLogGroupDto {
  dutyScheduleId: number | null;
  dutyScheduleName: string;
  startTime: string | null;
  endTime: string | null;
  entries: ShiftAttendanceLogEntryDto[];
}

export interface ShiftAttendanceLogDto {
  startDate: string;
  endDate: string;
  shifts: ShiftAttendanceLogGroupDto[];
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
  isManualEntry: boolean;
  manualEntryNote: string | null;
}
