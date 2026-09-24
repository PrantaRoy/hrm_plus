import { Prisma } from "../../../generated/tenant";
import {
  AttendanceDto,
  AttendanceMethod,
  AttendanceSettingsDto,
  EmployeeAttendanceDeviceDto,
  EmployeeAttendanceRulesDto,
  ListAttendanceItemDto,
} from "@hrm-plus/shared";

const attendanceWithBreaks = Prisma.validator<Prisma.AttendanceDefaultArgs>()({
  include: { breaks: true },
});
export type AttendanceWithBreaks = Prisma.AttendanceGetPayload<typeof attendanceWithBreaks>;

export const attendanceInclude = attendanceWithBreaks.include;

export function toAttendanceDto(attendance: AttendanceWithBreaks): AttendanceDto {
  return {
    id: attendance.id,
    employeeId: attendance.employeeId,
    dutyScheduleAssignmentId: attendance.dutyScheduleAssignmentId,
    date: attendance.date.toISOString(),
    checkInAt: attendance.checkInAt?.toISOString() ?? null,
    checkInMethod: (attendance.checkInMethod as AttendanceMethod | null) ?? null,
    isLate: attendance.isLate,
    lateReason: attendance.lateReason,
    checkOutAt: attendance.checkOutAt?.toISOString() ?? null,
    checkOutMethod: (attendance.checkOutMethod as AttendanceMethod | null) ?? null,
    isEarlyCheckout: attendance.isEarlyCheckout,
    earlyCheckoutReason: attendance.earlyCheckoutReason,
    isManualEntry: attendance.isManualEntry,
    manualEntryNote: attendance.manualEntryNote,
    breaks: attendance.breaks
      .slice()
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
      .map((b) => ({
        id: b.id,
        startAt: b.startAt.toISOString(),
        endAt: b.endAt?.toISOString() ?? null,
      })),
  };
}

export function toAttendanceSettingsDto(settings: {
  id: number;
  pressAndHoldEnabled: boolean;
  qrCodeEnabled: boolean;
  updatedById: number | null;
  updatedAt: Date;
}): AttendanceSettingsDto {
  return {
    id: settings.id,
    pressAndHoldEnabled: settings.pressAndHoldEnabled,
    qrCodeEnabled: settings.qrCodeEnabled,
    updatedById: settings.updatedById,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export function toEmployeeAttendanceRulesDto(
  employeeId: number,
  rules: { ipBindingEnabled: boolean; locationBindingEnabled: boolean; deviceBindingEnabled: boolean } | null,
  ipRuleIds: number[],
  locationIds: number[]
): EmployeeAttendanceRulesDto {
  return {
    employeeId,
    ipBindingEnabled: rules?.ipBindingEnabled ?? false,
    locationBindingEnabled: rules?.locationBindingEnabled ?? false,
    deviceBindingEnabled: rules?.deviceBindingEnabled ?? false,
    ipRuleIds,
    locationIds,
  };
}

export function toEmployeeAttendanceDeviceDto(device: {
  id: number;
  employeeId: number;
  deviceToken: string;
  label: string | null;
  status: string;
  lastSeenAt: Date | null;
  lastSeenIp: string | null;
  requestedAt: Date;
  approvedAt: Date | null;
}): EmployeeAttendanceDeviceDto {
  return {
    id: device.id,
    employeeId: device.employeeId,
    deviceToken: device.deviceToken,
    label: device.label,
    status: device.status as EmployeeAttendanceDeviceDto["status"],
    lastSeenAt: device.lastSeenAt?.toISOString() ?? null,
    lastSeenIp: device.lastSeenIp,
    requestedAt: device.requestedAt.toISOString(),
    approvedAt: device.approvedAt?.toISOString() ?? null,
  };
}

export function totalBreakMinutes(breaks: { startAt: Date; endAt: Date | null }[]): number {
  return breaks.reduce((sum, b) => {
    if (!b.endAt) return sum;
    return sum + Math.round((b.endAt.getTime() - b.startAt.getTime()) / 60000);
  }, 0);
}

interface AssignmentForListing {
  id: number;
  employeeId: number;
  date: Date;
  status: string;
  employee: { firstName: string; lastName: string; employeeCode: string } | null;
  dutySchedule: { name: string } | null;
  attendance: AttendanceWithBreaks | null;
}

export function toListAttendanceItemDto(assignment: AssignmentForListing): ListAttendanceItemDto {
  const attendance = assignment.attendance;
  return {
    id: assignment.id,
    employeeId: assignment.employeeId,
    employeeName: assignment.employee ? `${assignment.employee.firstName} ${assignment.employee.lastName}` : null,
    employeeCode: assignment.employee?.employeeCode ?? null,
    date: assignment.date.toISOString(),
    status: assignment.status as ListAttendanceItemDto["status"],
    dutyScheduleName: assignment.dutySchedule?.name ?? null,
    checkInAt: attendance?.checkInAt?.toISOString() ?? null,
    isLate: attendance?.isLate ?? false,
    lateReason: attendance?.lateReason ?? null,
    checkOutAt: attendance?.checkOutAt?.toISOString() ?? null,
    isEarlyCheckout: attendance?.isEarlyCheckout ?? false,
    earlyCheckoutReason: attendance?.earlyCheckoutReason ?? null,
    totalBreakMinutes: attendance ? totalBreakMinutes(attendance.breaks) : 0,
    isManualEntry: attendance?.isManualEntry ?? false,
    manualEntryNote: attendance?.manualEntryNote ?? null,
  };
}
