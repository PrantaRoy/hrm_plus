import { Prisma } from "../../../generated/tenant";
import { AttendanceDto, AttendanceMethod, AttendanceSettingsDto, ListAttendanceItemDto } from "@hrm-plus/shared";

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
  updatedById: number | null;
  updatedAt: Date;
}): AttendanceSettingsDto {
  return {
    id: settings.id,
    pressAndHoldEnabled: settings.pressAndHoldEnabled,
    updatedById: settings.updatedById,
    updatedAt: settings.updatedAt.toISOString(),
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
  };
}
