import { PrismaClient } from "../../../generated/tenant";
import {
  AvailabilityReportDto,
  ConflictSeverity,
  ConflictType,
  ParticipantConflictDto,
} from "@hrm-plus/shared";
import { addMinutes, combineDateAndTimeInZone, toDateKey, toDateOnlyUTC } from "../../utils/date";
import { getTenantTimezone } from "../general-settings/generalSettings.service";
import { getPublishedHolidaysInRange } from "../holidays/holiday.service";
import { isWeekendDate, loadWeekendNames } from "../../utils/weekday";
import { getOrCreateSettings } from "../scheduler-settings/schedulerSettings.service";

export interface AvailabilityParticipant {
  employeeId: number;
  isRequired: boolean;
}

export interface CheckAvailabilityArgs {
  startAt: Date;
  endAt: Date;
  participants: AvailabilityParticipant[];
  excludeMeetingId?: number;
}

function fmtTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

// Runs the conflict-detection matrix for a proposed meeting window against every
// participant's roster assignment, leave requests, and existing confirmed meetings.
// Never persists anything — callers decide what to do with the report.
export async function checkAvailability(
  prisma: PrismaClient,
  args: CheckAvailabilityArgs
): Promise<AvailabilityReportDto> {
  const { startAt, endAt, participants, excludeMeetingId } = args;
  const day = toDateOnlyUTC(startAt);
  const dayKey = toDateKey(day);

  const [settings, timezone, weekendNames, holidays] = await Promise.all([
    getOrCreateSettings(prisma),
    getTenantTimezone(prisma),
    loadWeekendNames(prisma),
    getPublishedHolidaysInRange(prisma, day, day),
  ]);

  const employeeIds = participants.map((p) => p.employeeId);
  const employees = await prisma.employee.findMany({
    where: { id: { in: employeeIds } },
    select: { id: true, firstName: true, lastName: true },
  });
  const nameById = new Map(employees.map((e) => [e.id, `${e.firstName} ${e.lastName}`]));

  const conflicts: ParticipantConflictDto[] = [];

  for (const participant of participants) {
    const employeeName = nameById.get(participant.employeeId) ?? `Employee #${participant.employeeId}`;

    const add = (type: ConflictType, severity: ConflictSeverity, message: string) => {
      // Optional participants never hard-block unless the tenant opts in.
      const effective: ConflictSeverity =
        severity === "BLOCK" && !participant.isRequired && !settings.optionalParticipantsCanBlock
          ? "WARNING"
          : severity;
      conflicts.push({
        employeeId: participant.employeeId,
        employeeName,
        isRequired: participant.isRequired,
        type,
        severity: effective,
        message,
      });
    };

    // 1. Roster / shift check ------------------------------------------------
    const assignment = await prisma.dutyScheduleAssignment.findFirst({
      where: {
        employeeId: participant.employeeId,
        date: day,
        ...(settings.considerApprovedRostersOnly ? { roster: { status: "Approved" } } : {}),
      },
      include: { dutySchedule: true },
    });

    if (!assignment) {
      const extra = holidays.has(dayKey)
        ? ` (${holidays.get(dayKey)!.name})`
        : isWeekendDate(weekendNames, day)
          ? " (that day is a weekly off day)"
          : "";
      add(
        "NO_ROSTER",
        settings.blockOnNoRoster ? "BLOCK" : "WARNING",
        `${employeeName} has no roster assignment on ${dayKey}${extra}`
      );
    } else if (assignment.status === "Cancelled") {
      add("NOT_WORKING", "WARNING", `${employeeName}'s roster assignment on ${dayKey} has been cancelled`);
    } else if (assignment.isHoliday) {
      add("HOLIDAY", "WARNING", `${dayKey} is a holiday for ${employeeName}`);
    } else if (assignment.isWeekend) {
      add("DAY_OFF", "WARNING", `${dayKey} is a weekly off day for ${employeeName}`);
    } else if (!assignment.dutyScheduleId || !assignment.dutySchedule) {
      add("NOT_WORKING", "WARNING", `${employeeName} has no shift time configured on ${dayKey}`);
    } else {
      const shiftStart = combineDateAndTimeInZone(assignment.date, assignment.dutySchedule.startTime, timezone);
      let shiftEnd = combineDateAndTimeInZone(assignment.date, assignment.dutySchedule.endTime, timezone);
      if (shiftEnd.getTime() <= shiftStart.getTime()) {
        shiftEnd = addMinutes(shiftEnd, 24 * 60); // overnight shift
      }
      if (!(shiftStart.getTime() <= startAt.getTime() && endAt.getTime() <= shiftEnd.getTime())) {
        add(
          "OUTSIDE_SHIFT",
          settings.blockOnOutsideShift ? "BLOCK" : "WARNING",
          `${employeeName}'s shift is ${assignment.dutySchedule.startTime}–${assignment.dutySchedule.endTime}; ` +
            `the meeting runs ${fmtTime(startAt, timezone)}–${fmtTime(endAt, timezone)}`
        );
      }
    }

    // 2. Leave check -------------------------------------------------------
    // Leave ranges are date-granular (UTC midnight); a meeting on any day in
    // [startDate, endDate] conflicts. Same overlap predicate as listLeaveRequests.
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId: participant.employeeId,
        status: { in: ["Approved", "Pending"] },
        endDate: { gte: day },
        startDate: { lte: day },
      },
      include: { allocation: { include: { leaveType: true } } },
    });
    for (const leave of leaves) {
      const leaveTypeName = leave.allocation.leaveType.name;
      if (leave.status === "Approved") {
        add(
          "APPROVED_LEAVE",
          settings.blockOnApprovedLeave ? "BLOCK" : "WARNING",
          `${employeeName} is on approved ${leaveTypeName} on ${dayKey}`
        );
      } else {
        add(
          "PENDING_LEAVE",
          settings.blockOnPendingLeave ? "BLOCK" : "WARNING",
          `${employeeName} has a pending ${leaveTypeName} request covering ${dayKey}`
        );
      }
    }

    // 3. Existing confirmed-meeting overlap ------------------------------
    const overlapping = await prisma.meetingParticipant.findMany({
      where: {
        employeeId: participant.employeeId,
        meeting: {
          status: "Confirmed",
          ...(excludeMeetingId ? { id: { not: excludeMeetingId } } : {}),
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
      },
      include: { meeting: true },
    });
    for (const row of overlapping) {
      add(
        "MEETING_OVERLAP",
        settings.blockOnMeetingOverlap ? "BLOCK" : "WARNING",
        `${employeeName} is already in "${row.meeting.title}" ` +
          `(${fmtTime(row.meeting.startAt, timezone)}–${fmtTime(row.meeting.endAt, timezone)}) on ${dayKey}`
      );
    }
  }

  return {
    conflicts,
    canConfirm: !conflicts.some((c) => c.severity === "BLOCK"),
    hasWarnings: conflicts.some((c) => c.severity === "WARNING"),
  };
}
