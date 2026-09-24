import { PrismaClient, Prisma } from "../../../generated/tenant";
import {
  AssignmentStatus,
  AttendanceDto,
  AttendanceMethod,
  AttendanceSettingsDto,
  CheckInInput,
  CheckOutInput,
  EmployeeAttendanceMethodsDto,
  ListAttendanceItemDto,
  ListAttendanceQuery,
  ManualAttendanceInput,
  SetEmployeeAttendanceMethodsInput,
  ShiftAttendanceLogDto,
  ShiftAttendanceLogGroupDto,
  TodayAttendanceDto,
  UpdateAttendanceSettingsInput,
  WorksheetQuery,
  WorksheetRowDto,
} from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { addMinutes, combineDateAndTimeInZone, toDateKey, toDateOnlyUTC } from "../../utils/date";
import { getTenantTimezone } from "../general-settings/generalSettings.service";
import { assertNotPayrollLocked } from "../payroll/payrollLock";
import { toAssignmentDto } from "../rosters/assignment.mapper";
import {
  toAttendanceDto,
  toAttendanceSettingsDto,
  toListAttendanceItemDto,
  totalBreakMinutes,
} from "./attendance.mapper";
import { enforceAttendanceRestrictions } from "./attendanceRestrictions.service";
import { assertValidQrToken } from "./attendanceQr.service";

const assignmentWithAttendance = Prisma.validator<Prisma.DutyScheduleAssignmentDefaultArgs>()({
  include: {
    employee: true,
    dutySchedule: true,
    attendance: { include: { breaks: true } },
  },
});
type AssignmentWithAttendance = Prisma.DutyScheduleAssignmentGetPayload<typeof assignmentWithAttendance>;

async function findAssignmentForDate(
  prisma: PrismaClient,
  employeeId: number,
  date: Date
): Promise<AssignmentWithAttendance | null> {
  return prisma.dutyScheduleAssignment.findUnique({
    where: { employeeId_date: { employeeId, date: toDateOnlyUTC(date) } },
    include: assignmentWithAttendance.include,
  });
}

async function findTodayAssignment(prisma: PrismaClient, employeeId: number): Promise<AssignmentWithAttendance | null> {
  return findAssignmentForDate(prisma, employeeId, new Date());
}

// AttendanceSettings is a tenant-wide singleton; there is no dedicated "settings"
// concept elsewhere in this codebase, so it's enforced here via get-or-create.
export async function getOrCreateSettings(prisma: PrismaClient) {
  const existing = await prisma.attendanceSettings.findFirst();
  if (existing) return existing;
  return prisma.attendanceSettings.create({ data: {} });
}

export async function getAttendanceSettings(prisma: PrismaClient): Promise<AttendanceSettingsDto> {
  return toAttendanceSettingsDto(await getOrCreateSettings(prisma));
}

export async function updateAttendanceSettings(
  prisma: PrismaClient,
  input: UpdateAttendanceSettingsInput,
  updatedById: number
): Promise<AttendanceSettingsDto> {
  const existing = await getOrCreateSettings(prisma);
  const updated = await prisma.attendanceSettings.update({
    where: { id: existing.id },
    data: { pressAndHoldEnabled: input.pressAndHoldEnabled, qrCodeEnabled: input.qrCodeEnabled, updatedById },
  });
  return toAttendanceSettingsDto(updated);
}

async function tenantEnabledMethods(prisma: PrismaClient): Promise<Set<AttendanceMethod>> {
  const settings = await getOrCreateSettings(prisma);
  const enabled = new Set<AttendanceMethod>();
  if (settings.pressAndHoldEnabled) enabled.add("PressAndHold");
  if (settings.qrCodeEnabled) enabled.add("QrCode");
  return enabled;
}

async function getAvailableMethods(prisma: PrismaClient, employeeId: number): Promise<AttendanceMethod[]> {
  const [enabled, assigned] = await Promise.all([
    tenantEnabledMethods(prisma),
    prisma.employeeAttendanceMethod.findMany({ where: { employeeId } }),
  ]);
  return assigned.map((a) => a.method as AttendanceMethod).filter((m) => enabled.has(m));
}

async function assertMethodAllowed(prisma: PrismaClient, employeeId: number, method: AttendanceMethod): Promise<void> {
  const available = await getAvailableMethods(prisma, employeeId);
  if (!available.includes(method)) {
    throw ApiError.forbidden("This attendance method is not enabled for you");
  }
}

export async function getEmployeeMethods(prisma: PrismaClient, employeeId: number): Promise<EmployeeAttendanceMethodsDto> {
  const rows = await prisma.employeeAttendanceMethod.findMany({ where: { employeeId } });
  return { employeeId, methods: rows.map((r) => r.method as AttendanceMethod) };
}

export async function setEmployeeMethods(
  prisma: PrismaClient,
  employeeId: number,
  input: SetEmployeeAttendanceMethodsInput
): Promise<EmployeeAttendanceMethodsDto> {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw ApiError.notFound("Employee not found");
  }

  const enabled = await tenantEnabledMethods(prisma);
  for (const method of input.methods) {
    if (!enabled.has(method)) {
      throw ApiError.badRequest(`Attendance method "${method}" is not enabled tenant-wide`);
    }
  }

  await prisma.$transaction([
    prisma.employeeAttendanceMethod.deleteMany({ where: { employeeId } }),
    prisma.employeeAttendanceMethod.createMany({
      data: input.methods.map((method) => ({ employeeId, method })),
    }),
  ]);

  return getEmployeeMethods(prisma, employeeId);
}

interface RestrictionFlags {
  requiresLocationBinding: boolean;
  requiresIpBinding: boolean;
}

function buildTodayDto(
  assignment: AssignmentWithAttendance | null,
  availableMethods: AttendanceMethod[],
  restrictionFlags: RestrictionFlags,
  timezone: string
): TodayAttendanceDto {
  if (!assignment) {
    return {
      assignment: null,
      dutyScheduleName: null,
      scheduledStart: null,
      scheduledEnd: null,
      checkinConsiderMinutes: null,
      checkoutConsiderMinutes: null,
      attendance: null,
      isOnBreak: false,
      availableMethods,
      canCheckIn: false,
      canCheckOut: false,
      canStartBreak: false,
      canEndBreak: false,
      canResumeAfterCheckout: false,
      ...restrictionFlags,
      blockedReason: "No duty schedule assigned for today",
    };
  }

  const attendance = assignment.attendance;
  const openBreak = attendance?.breaks.find((b) => b.endAt === null) ?? null;

  let blockedReason: string | null = null;
  if (assignment.status === "Cancelled") blockedReason = "This day's assignment has been cancelled";
  else if (assignment.isHoliday) blockedReason = "Today is a holiday";
  else if (assignment.isWeekend) blockedReason = "Today is a weekly off day";
  else if (assignment.isLeave || assignment.status === "OnLeave") blockedReason = "You are on approved leave today";
  else if (!assignment.dutyScheduleId) blockedReason = "No duty schedule time configured for today";

  const canCheckIn = !blockedReason && !attendance?.checkInAt && availableMethods.length > 0;
  const canCheckOut = !blockedReason && !!attendance?.checkInAt && !attendance?.checkOutAt && !openBreak;
  const canStartBreak = !!attendance?.checkInAt && !attendance?.checkOutAt && !openBreak;
  const canEndBreak = !!openBreak;

  let canResumeAfterCheckout = false;
  if (!blockedReason && attendance?.checkOutAt && assignment.dutySchedule) {
    const scheduledEnd = combineDateAndTimeInZone(assignment.date, assignment.dutySchedule.endTime, timezone);
    canResumeAfterCheckout = new Date() < scheduledEnd && availableMethods.length > 0;
  }

  return {
    assignment: toAssignmentDto(assignment),
    dutyScheduleName: assignment.dutySchedule?.name ?? null,
    scheduledStart: assignment.dutySchedule?.startTime ?? null,
    scheduledEnd: assignment.dutySchedule?.endTime ?? null,
    checkinConsiderMinutes: assignment.dutySchedule?.checkinConsiderMinutes ?? null,
    checkoutConsiderMinutes: assignment.dutySchedule?.checkoutConsiderMinutes ?? null,
    attendance: attendance ? toAttendanceDto(attendance) : null,
    isOnBreak: !!openBreak,
    availableMethods,
    canCheckIn,
    canCheckOut,
    canStartBreak,
    canEndBreak,
    canResumeAfterCheckout,
    ...restrictionFlags,
    blockedReason,
  };
}

async function getRestrictionFlags(prisma: PrismaClient, employeeId: number): Promise<RestrictionFlags> {
  const rules = await prisma.employeeAttendanceRules.findUnique({ where: { employeeId } });
  return {
    requiresLocationBinding: rules?.locationBindingEnabled ?? false,
    requiresIpBinding: rules?.ipBindingEnabled ?? false,
  };
}

export async function getTodayForEmployee(prisma: PrismaClient, employeeId: number): Promise<TodayAttendanceDto> {
  await markIncompleteAssignments(prisma, { employeeId, lookbackDays: 14 });

  const [assignment, availableMethods, restrictionFlags, timezone] = await Promise.all([
    findTodayAssignment(prisma, employeeId),
    getAvailableMethods(prisma, employeeId),
    getRestrictionFlags(prisma, employeeId),
    getTenantTimezone(prisma),
  ]);

  return buildTodayDto(assignment, availableMethods, restrictionFlags, timezone);
}

export interface CheckInServiceInput extends CheckInInput {
  clientIp: string | null;
}

export async function checkIn(prisma: PrismaClient, employeeId: number, input: CheckInServiceInput): Promise<TodayAttendanceDto> {
  const assignment = await findTodayAssignment(prisma, employeeId);
  if (!assignment) throw ApiError.badRequest("No duty schedule assigned for today");
  if (assignment.status === "Cancelled") throw ApiError.badRequest("This day's assignment has been cancelled");
  if (assignment.isHoliday) throw ApiError.badRequest("Cannot check in on a holiday");
  if (assignment.isWeekend) throw ApiError.badRequest("Cannot check in on a weekly off day");
  if (assignment.isLeave || assignment.status === "OnLeave") {
    throw ApiError.badRequest("You are on approved leave today");
  }
  if (!assignment.dutySchedule) {
    throw ApiError.badRequest("No duty schedule time configured for today's assignment");
  }

  const existingAttendance = assignment.attendance;
  const isResume = !!existingAttendance?.checkInAt && !!existingAttendance?.checkOutAt;
  if (existingAttendance?.checkInAt && !existingAttendance.checkOutAt) {
    throw ApiError.conflict("Already checked in today");
  }

  await assertMethodAllowed(prisma, employeeId, input.method);
  if (input.method === "QrCode") {
    await assertValidQrToken(prisma, input.qrToken, employeeId, "CheckIn");
  } else {
    await enforceAttendanceRestrictions(prisma, employeeId, {
      ip: input.clientIp,
      deviceToken: input.deviceToken,
      latitude: input.latitude,
      longitude: input.longitude,
    });
  }
  await assertNotPayrollLocked(prisma, employeeId, assignment.date);

  const now = new Date();
  const timezone = await getTenantTimezone(prisma);
  const scheduledStart = combineDateAndTimeInZone(assignment.date, assignment.dutySchedule.startTime, timezone);

  if (isResume) {
    // Correcting an accidental checkout: resume is allowed any number of times as
    // long as the shift isn't over yet. The checkout→checkin gap is logged as an
    // automatic break; the day's original checkInAt/isLate/lateReason are untouched.
    const scheduledEnd = combineDateAndTimeInZone(assignment.date, assignment.dutySchedule.endTime, timezone);
    if (now > scheduledEnd) {
      throw ApiError.badRequest("Cannot check in again — today's shift has ended");
    }

    await prisma.$transaction([
      prisma.breakLog.create({
        data: {
          attendanceId: existingAttendance!.id,
          startAt: existingAttendance!.checkOutAt!,
          endAt: now,
          isAutomatic: true,
        },
      }),
      prisma.attendance.update({
        where: { id: existingAttendance!.id },
        data: { checkOutAt: null, checkOutMethod: null, isEarlyCheckout: false, earlyCheckoutReason: null },
      }),
      prisma.dutyScheduleAssignment.update({ where: { id: assignment.id }, data: { status: "CheckedIn" } }),
    ]);

    return getTodayForEmployee(prisma, employeeId);
  }

  const earliestAllowed = addMinutes(scheduledStart, -assignment.dutySchedule.earlyCheckinBufferMinutes);
  if (now < earliestAllowed) {
    throw ApiError.badRequest("Too early to check in for today's duty");
  }

  const lateThreshold = addMinutes(scheduledStart, assignment.dutySchedule.checkinConsiderMinutes);
  const isLate = now > lateThreshold;
  const reason = input.reason?.trim() || "";
  if (isLate && !reason) {
    throw ApiError.badRequest("A reason is required for a late check-in");
  }

  await prisma.$transaction([
    prisma.attendance.upsert({
      where: { dutyScheduleAssignmentId: assignment.id },
      create: {
        employeeId,
        dutyScheduleAssignmentId: assignment.id,
        date: assignment.date,
        checkInAt: now,
        checkInMethod: input.method,
        isLate,
        lateReason: isLate ? reason : null,
      },
      update: {
        checkInAt: now,
        checkInMethod: input.method,
        isLate,
        lateReason: isLate ? reason : null,
      },
    }),
    prisma.dutyScheduleAssignment.update({ where: { id: assignment.id }, data: { status: "CheckedIn" } }),
  ]);

  return getTodayForEmployee(prisma, employeeId);
}

export interface CheckOutServiceInput extends CheckOutInput {
  clientIp: string | null;
}

export async function checkOut(prisma: PrismaClient, employeeId: number, input: CheckOutServiceInput): Promise<TodayAttendanceDto> {
  const assignment = await findTodayAssignment(prisma, employeeId);
  if (!assignment || !assignment.dutySchedule) {
    throw ApiError.badRequest("No duty schedule assigned for today");
  }
  const attendance = assignment.attendance;
  if (!attendance?.checkInAt) {
    throw ApiError.badRequest("You have not checked in today");
  }
  if (attendance.checkOutAt) {
    throw ApiError.conflict("Already checked out today");
  }
  const openBreak = attendance.breaks.find((b) => b.endAt === null);
  if (openBreak) {
    throw ApiError.conflict("End your current break before checking out");
  }

  await assertMethodAllowed(prisma, employeeId, input.method);
  if (input.method === "QrCode") {
    await assertValidQrToken(prisma, input.qrToken, employeeId, "CheckOut");
  } else {
    await enforceAttendanceRestrictions(prisma, employeeId, {
      ip: input.clientIp,
      deviceToken: input.deviceToken,
      latitude: input.latitude,
      longitude: input.longitude,
    });
  }
  await assertNotPayrollLocked(prisma, employeeId, assignment.date);

  const now = new Date();
  const timezone = await getTenantTimezone(prisma);
  const scheduledEnd = combineDateAndTimeInZone(assignment.date, assignment.dutySchedule.endTime, timezone);
  const earlyThreshold = addMinutes(scheduledEnd, -assignment.dutySchedule.checkoutConsiderMinutes);
  const isEarlyCheckout = now < earlyThreshold;
  const reason = input.reason?.trim() || "";
  if (isEarlyCheckout && !reason) {
    throw ApiError.badRequest("A reason is required for an early checkout");
  }

  await prisma.$transaction([
    prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutAt: now,
        checkOutMethod: input.method,
        isEarlyCheckout,
        earlyCheckoutReason: isEarlyCheckout ? reason : null,
      },
    }),
    prisma.dutyScheduleAssignment.update({ where: { id: assignment.id }, data: { status: "Completed" } }),
  ]);

  return getTodayForEmployee(prisma, employeeId);
}

// Admin/HR override for a missed or incorrect punch. Requires a pre-existing
// roster/duty-schedule assignment for that employee+date (the roster stays the
// single source of truth for who's scheduled where); this just records the
// actual times against it, bypassing method/reason/IP/location/device checks
// since it's an explicit administrative action, not a self-service one.
export async function setManualAttendance(
  prisma: PrismaClient,
  employeeId: number,
  input: ManualAttendanceInput,
  enteredById: number
): Promise<AttendanceDto> {
  const assignment = await findAssignmentForDate(prisma, employeeId, new Date(input.date));
  if (!assignment) {
    throw ApiError.badRequest("No duty schedule assignment found for this employee on this date");
  }
  if (!assignment.dutySchedule) {
    throw ApiError.badRequest("No duty schedule time configured for this assignment");
  }
  if (assignment.status === "Cancelled") {
    throw ApiError.badRequest("This day's assignment has been cancelled");
  }
  await assertNotPayrollLocked(prisma, employeeId, assignment.date);

  const timezone = await getTenantTimezone(prisma);
  const checkInAt = combineDateAndTimeInZone(assignment.date, input.checkInTime, timezone);
  const checkOutAt = input.checkOutTime
    ? combineDateAndTimeInZone(assignment.date, input.checkOutTime, timezone)
    : null;
  if (checkOutAt && checkOutAt <= checkInAt) {
    throw ApiError.badRequest("Check-out time must be after check-in time");
  }

  const scheduledStart = combineDateAndTimeInZone(assignment.date, assignment.dutySchedule.startTime, timezone);
  const lateThreshold = addMinutes(scheduledStart, assignment.dutySchedule.checkinConsiderMinutes);
  const isLate = checkInAt > lateThreshold;

  let isEarlyCheckout = false;
  if (checkOutAt) {
    const scheduledEnd = combineDateAndTimeInZone(assignment.date, assignment.dutySchedule.endTime, timezone);
    const earlyThreshold = addMinutes(scheduledEnd, -assignment.dutySchedule.checkoutConsiderMinutes);
    isEarlyCheckout = checkOutAt < earlyThreshold;
  }

  const note = input.note?.trim() || null;
  const newStatus = checkOutAt ? "Completed" : "CheckedIn";

  const [attendance] = await prisma.$transaction([
    prisma.attendance.upsert({
      where: { dutyScheduleAssignmentId: assignment.id },
      create: {
        employeeId,
        dutyScheduleAssignmentId: assignment.id,
        date: assignment.date,
        checkInAt,
        isLate,
        lateReason: isLate ? note : null,
        checkOutAt,
        isEarlyCheckout,
        earlyCheckoutReason: isEarlyCheckout ? note : null,
        isManualEntry: true,
        manualEntryById: enteredById,
        manualEntryNote: note,
      },
      update: {
        checkInAt,
        isLate,
        lateReason: isLate ? note : null,
        checkOutAt,
        isEarlyCheckout,
        earlyCheckoutReason: isEarlyCheckout ? note : null,
        isManualEntry: true,
        manualEntryById: enteredById,
        manualEntryNote: note,
      },
      include: { breaks: true },
    }),
    prisma.dutyScheduleAssignment.update({ where: { id: assignment.id }, data: { status: newStatus } }),
  ]);

  return toAttendanceDto(attendance);
}

async function todayAttendanceOrThrow(prisma: PrismaClient, employeeId: number) {
  const assignment = await findTodayAssignment(prisma, employeeId);
  if (!assignment?.attendance) {
    throw ApiError.badRequest("You have not checked in today");
  }
  return assignment.attendance;
}

export async function startBreak(prisma: PrismaClient, employeeId: number): Promise<TodayAttendanceDto> {
  const attendance = await todayAttendanceOrThrow(prisma, employeeId);
  if (!attendance.checkInAt) throw ApiError.badRequest("You have not checked in today");
  if (attendance.checkOutAt) throw ApiError.badRequest("You have already checked out today");
  const openBreak = attendance.breaks.find((b) => b.endAt === null);
  if (openBreak) throw ApiError.conflict("A break is already in progress");
  await assertNotPayrollLocked(prisma, employeeId, attendance.date);

  await prisma.breakLog.create({ data: { attendanceId: attendance.id, startAt: new Date() } });
  return getTodayForEmployee(prisma, employeeId);
}

export async function endBreak(prisma: PrismaClient, employeeId: number): Promise<TodayAttendanceDto> {
  const attendance = await todayAttendanceOrThrow(prisma, employeeId);
  const openBreak = attendance.breaks.find((b) => b.endAt === null);
  if (!openBreak) throw ApiError.badRequest("No break is currently in progress");
  await assertNotPayrollLocked(prisma, employeeId, attendance.date);

  await prisma.breakLog.update({ where: { id: openBreak.id }, data: { endAt: new Date() } });
  return getTodayForEmployee(prisma, employeeId);
}

export interface MarkIncompleteOptions {
  employeeId?: number;
  departmentId?: number;
  startDate?: Date;
  endDate?: Date;
  lookbackDays?: number;
}

// No cron/scheduled-job infrastructure exists in this codebase, so a "day passed
// with no check-in" transition to Incomplete is swept lazily and scoped to
// whatever range the caller is about to read, instead of running in the background.
export async function markIncompleteAssignments(prisma: PrismaClient, options: MarkIncompleteOptions): Promise<void> {
  const now = new Date();
  const today = toDateOnlyUTC(now);
  const timezone = await getTenantTimezone(prisma);
  const rangeStart =
    options.startDate ?? (options.lookbackDays ? addMinutes(today, -options.lookbackDays * 24 * 60) : undefined);

  const candidates = await prisma.dutyScheduleAssignment.findMany({
    where: {
      status: "Scheduled",
      dutyScheduleId: { not: null },
      isHoliday: false,
      isWeekend: false,
      isLeave: false,
      attendance: { is: null },
      ...(options.employeeId ? { employeeId: options.employeeId } : {}),
      ...(options.departmentId ? { departmentId: options.departmentId } : {}),
      date: {
        ...(rangeStart ? { gte: rangeStart } : {}),
        lte: options.endDate ?? today,
      },
    },
    include: { dutySchedule: true },
  });

  const idsToMark: number[] = [];
  for (const assignment of candidates) {
    if (!assignment.dutySchedule) continue;
    const assignmentDay = toDateOnlyUTC(assignment.date);
    if (assignmentDay.getTime() < today.getTime()) {
      idsToMark.push(assignment.id);
      continue;
    }
    if (assignmentDay.getTime() === today.getTime()) {
      const scheduledEnd = combineDateAndTimeInZone(assignment.date, assignment.dutySchedule.endTime, timezone);
      const cutoff = addMinutes(scheduledEnd, assignment.dutySchedule.checkoutConsiderMinutes);
      if (now > cutoff) idsToMark.push(assignment.id);
    }
  }

  if (idsToMark.length > 0) {
    await prisma.dutyScheduleAssignment.updateMany({
      where: { id: { in: idsToMark } },
      data: { status: "Incomplete" },
    });
  }
}

export async function listAttendance(prisma: PrismaClient, query: ListAttendanceQuery): Promise<ListAttendanceItemDto[]> {
  await markIncompleteAssignments(prisma, {
    employeeId: query.employeeId,
    departmentId: query.departmentId,
    startDate: query.startDate ? new Date(query.startDate) : undefined,
    endDate: query.endDate ? new Date(query.endDate) : undefined,
  });

  const where: Prisma.DutyScheduleAssignmentWhereInput = {
    ...(query.employeeId ? { employeeId: query.employeeId } : {}),
    ...(query.departmentId ? { departmentId: query.departmentId } : {}),
    ...(query.dutyScheduleId ? { dutyScheduleId: query.dutyScheduleId } : {}),
    ...(query.startDate || query.endDate
      ? {
          date: {
            ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
            ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
          },
        }
      : {}),
  };

  const assignments = await prisma.dutyScheduleAssignment.findMany({
    where,
    include: { employee: true, dutySchedule: true, attendance: { include: { breaks: true } } },
    orderBy: [{ date: "desc" }, { employeeId: "asc" }],
  });

  return assignments.map(toListAttendanceItemDto);
}

interface AttendanceDeltaInput {
  date: Date;
  dutySchedule: { startTime: string; endTime: string } | null;
}

// Raw wall-clock differences against the scheduled shift boundaries — no grace
// period applied (isLate/isEarlyCheckout on the Attendance row already carry the
// graced verdict; this report shows the actual minutes early/late/over).
export function computeAttendanceDeltas(
  assignment: AttendanceDeltaInput,
  attendance: { checkInAt: Date | null; checkOutAt: Date | null } | null,
  timezone: string
): { lateMinutes: number; earlyLeaveMinutes: number; overtimeMinutes: number } {
  if (!attendance?.checkInAt || !assignment.dutySchedule) {
    return { lateMinutes: 0, earlyLeaveMinutes: 0, overtimeMinutes: 0 };
  }

  const scheduledStart = combineDateAndTimeInZone(assignment.date, assignment.dutySchedule.startTime, timezone);
  let scheduledEnd = combineDateAndTimeInZone(assignment.date, assignment.dutySchedule.endTime, timezone);
  if (scheduledEnd.getTime() <= scheduledStart.getTime()) {
    scheduledEnd = addMinutes(scheduledEnd, 24 * 60); // overnight shift
  }

  const lateMinutes = Math.max(
    0,
    Math.round((attendance.checkInAt.getTime() - scheduledStart.getTime()) / 60_000)
  );

  let earlyLeaveMinutes = 0;
  let overtimeMinutes = 0;
  if (attendance.checkOutAt) {
    const diff = Math.round((attendance.checkOutAt.getTime() - scheduledEnd.getTime()) / 60_000);
    if (diff >= 0) overtimeMinutes = diff;
    else earlyLeaveMinutes = -diff;
  }

  return { lateMinutes, earlyLeaveMinutes, overtimeMinutes };
}

export async function getShiftAttendanceLog(
  prisma: PrismaClient,
  range: { startDate: Date; endDate: Date }
): Promise<ShiftAttendanceLogDto> {
  await markIncompleteAssignments(prisma, { startDate: range.startDate, endDate: range.endDate });
  const timezone = await getTenantTimezone(prisma);

  const assignments = await prisma.dutyScheduleAssignment.findMany({
    where: {
      date: { gte: range.startDate, lte: range.endDate },
      OR: [{ dutyScheduleId: { not: null } }, { isLeave: true }],
    },
    include: { employee: true, dutySchedule: true, attendance: { include: { breaks: true } } },
    orderBy: [{ date: "asc" }, { employeeId: "asc" }],
  });

  const NO_SHIFT_KEY = "none";
  const groups = new Map<string, ShiftAttendanceLogGroupDto>();

  for (const a of assignments) {
    const key = a.dutyScheduleId ? String(a.dutyScheduleId) : NO_SHIFT_KEY;
    let group = groups.get(key);
    if (!group) {
      group = {
        dutyScheduleId: a.dutyScheduleId,
        dutyScheduleName: a.dutySchedule?.name ?? "On leave (no shift assigned)",
        startTime: a.dutySchedule?.startTime ?? null,
        endTime: a.dutySchedule?.endTime ?? null,
        entries: [],
      };
      groups.set(key, group);
    }

    const att = a.attendance;
    const deltas = computeAttendanceDeltas(a, att, timezone);

    group.entries.push({
      employeeId: a.employeeId,
      employeeName: a.employee ? `${a.employee.firstName} ${a.employee.lastName}` : null,
      employeeCode: a.employee?.employeeCode ?? null,
      date: a.date.toISOString(),
      status: a.status as AssignmentStatus,
      isLeave: a.isLeave,
      isHoliday: a.isHoliday,
      isWeekend: a.isWeekend,
      checkInAt: att?.checkInAt?.toISOString() ?? null,
      checkOutAt: att?.checkOutAt?.toISOString() ?? null,
      lateMinutes: deltas.lateMinutes,
      earlyLeaveMinutes: deltas.earlyLeaveMinutes,
      overtimeMinutes: deltas.overtimeMinutes,
      lateReason: att?.lateReason ?? null,
      earlyCheckoutReason: att?.earlyCheckoutReason ?? null,
      totalBreakMinutes: att ? totalBreakMinutes(att.breaks) : 0,
      isManualEntry: att?.isManualEntry ?? false,
    });
  }

  const shifts = [...groups.values()].sort((x, y) => {
    if (x.startTime && y.startTime) return x.startTime.localeCompare(y.startTime);
    if (x.startTime) return -1;
    if (y.startTime) return 1;
    return x.dutyScheduleName.localeCompare(y.dutyScheduleName);
  });

  return { startDate: toDateKey(range.startDate), endDate: toDateKey(range.endDate), shifts };
}

export async function getWorksheet(prisma: PrismaClient, query: WorksheetQuery): Promise<WorksheetRowDto[]> {
  await markIncompleteAssignments(prisma, {
    employeeId: query.employeeId,
    departmentId: query.departmentId,
    startDate: new Date(query.startDate),
    endDate: new Date(query.endDate),
  });

  const where: Prisma.DutyScheduleAssignmentWhereInput = {
    ...(query.employeeId ? { employeeId: query.employeeId } : {}),
    ...(query.departmentId ? { departmentId: query.departmentId } : {}),
    date: { gte: new Date(query.startDate), lte: new Date(query.endDate) },
  };

  const assignments = await prisma.dutyScheduleAssignment.findMany({
    where,
    include: { employee: { include: { department: true } }, attendance: { include: { breaks: true } } },
    orderBy: [{ employeeId: "asc" }, { date: "asc" }],
  });

  const rowsByEmployee = new Map<number, WorksheetRowDto>();
  for (const assignment of assignments) {
    const attendance = assignment.attendance;
    if (!attendance?.checkInAt || !attendance.checkOutAt) continue;

    const grossMinutes = Math.round((attendance.checkOutAt.getTime() - attendance.checkInAt.getTime()) / 60000);
    const breakMinutes = totalBreakMinutes(attendance.breaks);

    const existing = rowsByEmployee.get(assignment.employeeId);
    if (existing) {
      existing.daysPresent += 1;
      existing.totalMinutes += grossMinutes;
      existing.totalBreakMinutes += breakMinutes;
      existing.workingMinutes += grossMinutes - breakMinutes;
    } else {
      rowsByEmployee.set(assignment.employeeId, {
        employeeId: assignment.employeeId,
        employeeName: `${assignment.employee.firstName} ${assignment.employee.lastName}`,
        employeeCode: assignment.employee.employeeCode,
        departmentName: assignment.employee.department?.name ?? null,
        daysPresent: 1,
        totalMinutes: grossMinutes,
        totalBreakMinutes: breakMinutes,
        workingMinutes: grossMinutes - breakMinutes,
      });
    }
  }

  return Array.from(rowsByEmployee.values()).sort((a, b) => a.employeeName.localeCompare(b.employeeName));
}
