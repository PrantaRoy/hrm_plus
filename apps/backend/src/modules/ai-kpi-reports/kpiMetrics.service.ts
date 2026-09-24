import { PrismaClient } from "../../../generated/tenant";
import {
  AiKpiMetrics,
  AttendanceKpiEmployeeRow,
  AttendanceKpiMetrics,
  AttendanceKpiTotals,
  LeaveKpiEmployeeRow,
  LeaveKpiMetrics,
  TaskKpiEmployeeRow,
  TaskKpiMetrics,
  TaskKpiTotals,
} from "@hrm-plus/shared";
import { getTenantTimezone } from "../general-settings/generalSettings.service";
import { computeAttendanceDeltas, markIncompleteAssignments } from "../attendance/attendance.service";
import { totalBreakMinutes } from "../attendance/attendance.mapper";
import { ResolvedPeriod, ResolvedScope } from "./aiKpiScope.service";

const DAY_MS = 24 * 60 * 60 * 1000;
const round1 = (n: number) => Math.round(n * 10) / 10;
const percent = (part: number, whole: number): number | null => (whole > 0 ? round1((part / whole) * 100) : null);

type Employees = ResolvedScope["employees"];

// ---------------------------------------------------------------- attendance

interface AttendanceAccumulator {
  scheduledDays: number;
  presentDays: number;
  absentDays: number;
  lateCount: number;
  lateMinutesSum: number;
  earlyCheckoutCount: number;
  workedMinutes: number;
  overtimeMinutes: number;
}

const emptyAttendance = (): AttendanceAccumulator => ({
  scheduledDays: 0,
  presentDays: 0,
  absentDays: 0,
  lateCount: 0,
  lateMinutesSum: 0,
  earlyCheckoutCount: 0,
  workedMinutes: 0,
  overtimeMinutes: 0,
});

function toAttendanceTotals(a: AttendanceAccumulator): AttendanceKpiTotals {
  return {
    scheduledDays: a.scheduledDays,
    presentDays: a.presentDays,
    absentDays: a.absentDays,
    lateCount: a.lateCount,
    averageLateMinutes: a.lateCount > 0 ? Math.round(a.lateMinutesSum / a.lateCount) : 0,
    earlyCheckoutCount: a.earlyCheckoutCount,
    workedMinutes: a.workedMinutes,
    overtimeMinutes: a.overtimeMinutes,
    attendanceRate: percent(a.presentDays, a.scheduledDays),
  };
}

export async function computeAttendanceMetrics(
  prisma: PrismaClient,
  employees: Employees,
  period: ResolvedPeriod
): Promise<AttendanceKpiMetrics> {
  // Lazily flips overdue "Scheduled" rows to "Incomplete" so absences are counted correctly.
  await markIncompleteAssignments(prisma, { startDate: period.startDate, endDate: period.endDate });
  const timezone = await getTenantTimezone(prisma);

  const assignments = await prisma.dutyScheduleAssignment.findMany({
    where: {
      employeeId: { in: employees.map((e) => e.id) },
      date: { gte: period.startDate, lte: period.endDate },
      dutyScheduleId: { not: null },
      isLeave: false,
      isHoliday: false,
      isWeekend: false,
      status: { not: "Cancelled" },
    },
    include: { dutySchedule: true, attendance: { include: { breaks: true } } },
  });

  const byEmployee = new Map<number, AttendanceAccumulator>(employees.map((e) => [e.id, emptyAttendance()]));
  const total = emptyAttendance();

  for (const a of assignments) {
    const att = a.attendance;
    const present = !!att?.checkInAt;
    // A shift still ahead (Scheduled) is neither present nor absent, so it is left out of the denominator.
    if (!present && a.status !== "Incomplete") continue;

    const deltas = computeAttendanceDeltas(a, att, timezone);
    const worked =
      att?.checkInAt && att.checkOutAt
        ? Math.max(
            0,
            Math.round((att.checkOutAt.getTime() - att.checkInAt.getTime()) / 60_000) - totalBreakMinutes(att.breaks)
          )
        : 0;

    for (const acc of [byEmployee.get(a.employeeId)!, total]) {
      acc.scheduledDays += 1;
      if (present) {
        acc.presentDays += 1;
        acc.workedMinutes += worked;
        acc.overtimeMinutes += deltas.overtimeMinutes;
        if (att!.isLate) {
          acc.lateCount += 1;
          acc.lateMinutesSum += deltas.lateMinutes;
        }
        if (att!.isEarlyCheckout) acc.earlyCheckoutCount += 1;
      } else {
        acc.absentDays += 1;
      }
    }
  }

  const rows: AttendanceKpiEmployeeRow[] = employees.map((e) => ({
    employeeId: e.id,
    employeeName: e.name,
    ...toAttendanceTotals(byEmployee.get(e.id)!),
  }));
  return { totals: toAttendanceTotals(total), employees: rows };
}

// --------------------------------------------------------------------- leave

// Leave that straddles the period boundary only counts the part inside it (prorated by calendar days).
function daysInsidePeriod(
  request: { startDate: Date; endDate: Date; daysRequested: number },
  period: ResolvedPeriod
): number {
  const start = Math.max(request.startDate.getTime(), period.startDate.getTime());
  const end = Math.min(request.endDate.getTime(), period.endDate.getTime());
  if (end < start) return 0;
  const totalSpan = Math.round((request.endDate.getTime() - request.startDate.getTime()) / DAY_MS) + 1;
  const insideSpan = Math.round((end - start) / DAY_MS) + 1;
  return insideSpan === totalSpan ? request.daysRequested : round1((request.daysRequested * insideSpan) / totalSpan);
}

export async function computeLeaveMetrics(
  prisma: PrismaClient,
  employees: Employees,
  period: ResolvedPeriod
): Promise<LeaveKpiMetrics> {
  const ids = employees.map((e) => e.id);
  const [requests, allocations] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: {
        employeeId: { in: ids },
        startDate: { lte: period.endDate },
        endDate: { gte: period.startDate },
      },
      include: { allocation: { include: { leaveType: true } } },
    }),
    prisma.employeeLeaveAllocation.findMany({
      where: { employeeId: { in: ids }, year: period.endDate.getUTCFullYear(), status: "Active" },
    }),
  ]);

  const rows = new Map<number, LeaveKpiEmployeeRow>(
    employees.map((e) => [
      e.id,
      { employeeId: e.id, employeeName: e.name, approvedRequests: 0, approvedDays: 0, pendingDays: 0, remainingBalanceDays: 0 },
    ])
  );
  for (const alloc of allocations) {
    rows.get(alloc.employeeId)!.remainingBalanceDays += alloc.allocatedDays - alloc.daysUsed;
  }

  const counts = { requestCount: 0, approvedRequests: 0, pendingRequests: 0, rejectedRequests: 0, cancelledRequests: 0 };
  let approvedDays = 0;
  let pendingDays = 0;
  const daysByType = new Map<string, number>();

  for (const r of requests) {
    const days = daysInsidePeriod(r, period);
    const row = rows.get(r.employeeId)!;
    counts.requestCount += 1;
    if (r.status === "Approved") {
      counts.approvedRequests += 1;
      approvedDays += days;
      row.approvedRequests += 1;
      row.approvedDays = round1(row.approvedDays + days);
      const name = r.allocation.leaveType.name;
      daysByType.set(name, round1((daysByType.get(name) ?? 0) + days));
    } else if (r.status === "Pending") {
      counts.pendingRequests += 1;
      pendingDays += days;
      row.pendingDays = round1(row.pendingDays + days);
    } else if (r.status === "Rejected") {
      counts.rejectedRequests += 1;
    } else if (r.status === "Cancelled") {
      counts.cancelledRequests += 1;
    }
  }

  return {
    totals: {
      ...counts,
      approvedDays: round1(approvedDays),
      pendingDays: round1(pendingDays),
      daysByLeaveType: [...daysByType].map(([leaveTypeName, days]) => ({ leaveTypeName, days })),
      remainingBalanceDays: [...rows.values()].reduce((sum, r) => sum + r.remainingBalanceDays, 0),
    },
    employees: [...rows.values()],
  };
}

// ---------------------------------------------------------------------- task

const OPEN_TASK_STATUSES = ["to_do", "in_progress", "on_hold"];

// A date-only due date (midnight UTC) means "by the end of that day"; a due date with a time is used as-is.
export function taskDeadline(dueDate: Date): Date {
  return dueDate.getTime() % DAY_MS === 0 ? new Date(dueDate.getTime() + DAY_MS - 1) : dueDate;
}

interface TaskAccumulator {
  dueInPeriod: number;
  completedOnTime: number;
  completedLate: number;
  overdueOpen: number;
  openNotYetDue: number;
  openProgressSum: number;
  openCount: number;
  hoursLogged: number;
}

const emptyTasks = (): TaskAccumulator => ({
  dueInPeriod: 0,
  completedOnTime: 0,
  completedLate: 0,
  overdueOpen: 0,
  openNotYetDue: 0,
  openProgressSum: 0,
  openCount: 0,
  hoursLogged: 0,
});

function toTaskTotals(t: TaskAccumulator): TaskKpiTotals {
  return {
    dueInPeriod: t.dueInPeriod,
    completedOnTime: t.completedOnTime,
    completedLate: t.completedLate,
    overdueOpen: t.overdueOpen,
    openNotYetDue: t.openNotYetDue,
    onTimeRate: percent(t.completedOnTime, t.completedOnTime + t.completedLate + t.overdueOpen),
    averageOpenProgress: t.openCount > 0 ? Math.round(t.openProgressSum / t.openCount) : null,
    hoursLogged: round1(t.hoursLogged),
  };
}

export async function computeTaskMetrics(
  prisma: PrismaClient,
  employees: Employees,
  period: ResolvedPeriod,
  now = new Date()
): Promise<TaskKpiMetrics> {
  const ids = employees.map((e) => e.id);
  const periodEndExclusive = new Date(period.endDate.getTime() + DAY_MS);

  const [memberships, timeEntries] = await Promise.all([
    prisma.taskMember.findMany({
      where: {
        employeeId: { in: ids },
        task: { dueDate: { gte: period.startDate, lt: periodEndExclusive }, status: { not: "cancelled" } },
      },
      include: { task: true },
    }),
    prisma.timeEntry.findMany({
      where: {
        employeeId: { in: ids },
        startTime: { gte: period.startDate, lt: periodEndExclusive },
        endTime: { not: null },
      },
      select: { employeeId: true, startTime: true, endTime: true },
    }),
  ]);

  const byEmployee = new Map<number, TaskAccumulator>(employees.map((e) => [e.id, emptyTasks()]));
  const total = emptyTasks();

  for (const m of memberships) {
    const task = m.task;
    const deadline = taskDeadline(task.dueDate!);
    for (const acc of [byEmployee.get(m.employeeId)!, total]) {
      acc.dueInPeriod += 1;
      if (task.status === "completed") {
        const finishedAt = task.completedAt ?? task.updatedAt;
        if (finishedAt.getTime() <= deadline.getTime()) acc.completedOnTime += 1;
        else acc.completedLate += 1;
      } else if (OPEN_TASK_STATUSES.includes(task.status)) {
        acc.openProgressSum += task.progressPercentage;
        acc.openCount += 1;
        if (deadline.getTime() < now.getTime()) acc.overdueOpen += 1;
        else acc.openNotYetDue += 1;
      }
    }
  }

  for (const entry of timeEntries) {
    const hours = (entry.endTime!.getTime() - entry.startTime.getTime()) / 3_600_000;
    byEmployee.get(entry.employeeId)!.hoursLogged += hours;
    total.hoursLogged += hours;
  }

  const rows: TaskKpiEmployeeRow[] = employees.map((e) => ({
    employeeId: e.id,
    employeeName: e.name,
    ...toTaskTotals(byEmployee.get(e.id)!),
  }));
  return { totals: toTaskTotals(total), employees: rows };
}

export async function computeKpiMetrics(
  prisma: PrismaClient,
  employees: Employees,
  period: ResolvedPeriod
): Promise<AiKpiMetrics> {
  const [attendance, leave, task] = await Promise.all([
    computeAttendanceMetrics(prisma, employees, period),
    computeLeaveMetrics(prisma, employees, period),
    computeTaskMetrics(prisma, employees, period),
  ]);
  return { attendance, leave, task };
}
