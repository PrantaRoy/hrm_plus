import { PrismaClient } from "../../../generated/tenant";
import {
  DashboardCalendarDayDto,
  DashboardLeaveStatusCountDto,
  DashboardSummaryDto,
  DashboardTrendPointDto,
  DashboardTrendsDto,
  LeaveRequestStatus,
} from "@hrm-plus/shared";
import { addMinutes, enumerateDateKeys, toDateKey, toDateOnlyUTC } from "../../utils/date";
import { isWeekendDate, loadWeekendNames } from "../../utils/weekday";
import { markIncompleteAssignments } from "../attendance/attendance.service";
import { ActingUser, listPendingMyApproval } from "../leave-requests/leaveRequest.service";
import { getPublishedHolidaysInRange } from "../holidays/holiday.service";

export async function getSummary(prisma: PrismaClient, actingUser: ActingUser): Promise<DashboardSummaryDto> {
  const today = toDateOnlyUTC(new Date());

  // Status transitions ("Scheduled" -> "Incomplete") are swept lazily on read
  // (see attendance.service.ts#markIncompleteAssignments); must run before counting.
  await markIncompleteAssignments(prisma, { startDate: today, endDate: today });

  const [dutyAssignedToday, completedToday, incompleteToday, workingAssignmentsToday, presentToday, lateToday, pending] =
    await Promise.all([
      prisma.dutyScheduleAssignment.count({ where: { date: today } }),
      prisma.dutyScheduleAssignment.count({ where: { date: today, status: "Completed" } }),
      prisma.dutyScheduleAssignment.count({ where: { date: today, status: "Incomplete" } }),
      prisma.dutyScheduleAssignment.count({
        where: { date: today, isHoliday: false, isWeekend: false, isLeave: false, status: { not: "Cancelled" } },
      }),
      prisma.attendance.count({ where: { date: today, checkInAt: { not: null } } }),
      prisma.attendance.count({ where: { date: today, isLate: true } }),
      // Reused, not reimplemented: this is the same role/step-eligibility-scoped set
      // shown on /leave/approvals, so the dashboard count never drifts from that page.
      listPendingMyApproval(prisma, actingUser),
    ]);

  // Live snapshot: anyone not yet checked in today counts as absent, even mid-shift.
  // This naturally converges with incompleteToday once each shift's cutoff passes.
  const absentToday = Math.max(0, workingAssignmentsToday - presentToday);

  return {
    date: toDateKey(today),
    dutyAssignedToday,
    completedToday,
    incompleteToday,
    presentToday,
    absentToday,
    lateToday,
    pendingLeaveApprovalsCount: pending.length,
    pendingLeaveApprovalsPreview: pending.slice(0, 5),
  };
}

function toCountMap(rows: { date: Date; _count: { _all: number } }[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) map.set(toDateKey(row.date), row._count._all);
  return map;
}

export async function getTrends(prisma: PrismaClient, startDate: Date, endDate: Date): Promise<DashboardTrendsDto> {
  await markIncompleteAssignments(prisma, { startDate, endDate });

  const dateRange = { gte: startDate, lte: endDate };
  const createdAtRange = { gte: startDate, lt: addMinutes(endDate, 24 * 60) };

  const [totalByDate, workingByDate, leaveByDate, presentByDate, lateByDate, leaveStatusRaw] = await Promise.all([
    prisma.dutyScheduleAssignment.groupBy({ by: ["date"], where: { date: dateRange }, _count: { _all: true } }),
    prisma.dutyScheduleAssignment.groupBy({
      by: ["date"],
      where: { date: dateRange, isHoliday: false, isWeekend: false, isLeave: false, status: { not: "Cancelled" } },
      _count: { _all: true },
    }),
    prisma.dutyScheduleAssignment.groupBy({
      by: ["date"],
      where: { date: dateRange, isLeave: true },
      _count: { _all: true },
    }),
    prisma.attendance.groupBy({
      by: ["date"],
      where: { date: dateRange, checkInAt: { not: null } },
      _count: { _all: true },
    }),
    prisma.attendance.groupBy({ by: ["date"], where: { date: dateRange, isLate: true }, _count: { _all: true } }),
    prisma.leaveRequest.groupBy({ by: ["status"], where: { createdAt: createdAtRange }, _count: { _all: true } }),
  ]);

  const totalMap = toCountMap(totalByDate);
  const workingMap = toCountMap(workingByDate);
  const leaveMap = toCountMap(leaveByDate);
  const presentMap = toCountMap(presentByDate);
  const lateMap = toCountMap(lateByDate);

  // Every date in the range gets a point, even with zero rostered assignments,
  // so the trend lines stay continuous instead of skipping days.
  const points: DashboardTrendPointDto[] = enumerateDateKeys(startDate, endDate).map((date) => {
    const working = workingMap.get(date) ?? 0;
    const present = presentMap.get(date) ?? 0;
    return {
      date,
      dutyAssigned: totalMap.get(date) ?? 0,
      present,
      absent: Math.max(0, working - present),
      late: lateMap.get(date) ?? 0,
      onLeave: leaveMap.get(date) ?? 0,
    };
  });

  const leaveStatusBreakdown: DashboardLeaveStatusCountDto[] = leaveStatusRaw.map((row) => ({
    status: row.status as LeaveRequestStatus,
    count: row._count._all,
  }));

  return { startDate: toDateKey(startDate), endDate: toDateKey(endDate), points, leaveStatusBreakdown };
}

export async function getCalendar(
  prisma: PrismaClient,
  startDate: Date,
  endDate: Date
): Promise<DashboardCalendarDayDto[]> {
  const dateRange = { gte: startDate, lte: endDate };

  const [holidays, dutyCounts, weekendNames, assignmentFlags] = await Promise.all([
    getPublishedHolidaysInRange(prisma, startDate, endDate),
    prisma.dutyScheduleAssignment.groupBy({ by: ["date"], where: { date: dateRange }, _count: { _all: true } }),
    loadWeekendNames(prisma),
    prisma.dutyScheduleAssignment.findMany({
      where: { date: dateRange },
      distinct: ["date"],
      select: { date: true, isWeekend: true },
    }),
  ]);

  const dutyCountMap = toCountMap(dutyCounts);
  const weekendFlagMap = new Map<string, boolean>();
  for (const row of assignmentFlags) weekendFlagMap.set(toDateKey(row.date), row.isWeekend);

  return enumerateDateKeys(startDate, endDate).map((date) => {
    const holiday = holidays.get(date);
    // Days with at least one assignment already carry a persisted isWeekend flag;
    // only a day with zero assignments needs the WeekDay-table fallback.
    const isWeekend = weekendFlagMap.get(date) ?? isWeekendDate(weekendNames, new Date(`${date}T00:00:00.000Z`));
    return {
      date,
      isHoliday: Boolean(holiday),
      holidayName: holiday?.name ?? null,
      isWeekend,
      dutyAssignedCount: dutyCountMap.get(date) ?? 0,
    };
  });
}
