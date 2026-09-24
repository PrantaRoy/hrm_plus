import { PrismaClient, Prisma } from "../../../generated/tenant";
import { ListWorkReportsQuery, WorkReportDto } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { combineDateAndTimeUTC } from "../../utils/date";
import { totalBreakMinutes } from "../attendance/attendance.mapper";
import { toWorkReportDto, workReportInclude } from "./workReport.mapper";

const assignmentForAggregation = Prisma.validator<Prisma.DutyScheduleAssignmentDefaultArgs>()({
  include: { dutySchedule: true, attendance: { include: { breaks: true } } },
});
type AssignmentForAggregation = Prisma.DutyScheduleAssignmentGetPayload<typeof assignmentForAggregation>;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Splits one day's worked minutes into regular vs extra against the assignment's
// DutySchedule window, capped at maxOverTimeMinutes when that cap is set (>0).
// A day with no complete check-in/check-out pair contributes nothing — it's left
// for HR to see as a gap on the DRAFT report rather than guessed at.
function splitDayMinutes(assignment: AssignmentForAggregation): { regular: number; extra: number } {
  const attendance = assignment.attendance;
  if (!attendance?.checkInAt || !attendance?.checkOutAt) return { regular: 0, extra: 0 };

  const grossMinutes = Math.round((attendance.checkOutAt.getTime() - attendance.checkInAt.getTime()) / 60000);
  const workedMinutes = Math.max(0, grossMinutes - totalBreakMinutes(attendance.breaks));

  if (!assignment.dutySchedule) return { regular: workedMinutes, extra: 0 };

  const scheduledStart = combineDateAndTimeUTC(assignment.date, assignment.dutySchedule.startTime);
  const scheduledEnd = combineDateAndTimeUTC(assignment.date, assignment.dutySchedule.endTime);
  const scheduledMinutes = Math.max(0, Math.round((scheduledEnd.getTime() - scheduledStart.getTime()) / 60000));

  const regular = Math.min(workedMinutes, scheduledMinutes);
  const extraRaw = Math.max(0, workedMinutes - scheduledMinutes);
  const cap = assignment.dutySchedule.maxOverTimeMinutes > 0 ? assignment.dutySchedule.maxOverTimeMinutes : Infinity;
  const extra = Math.min(extraRaw, cap);

  return { regular, extra };
}

// Auto-aggregates payable hours from existing Attendance + DutySchedule records for
// every active employee assigned to payCycleId, upserting a DRAFT WorkReport per
// employee for [periodStart, periodEnd]. Safe to re-run: reports already
// HR_APPROVED/PAYROLL_PROCESSED for the period are left untouched (they're locked),
// only DRAFT reports get refreshed with the latest attendance numbers.
export async function generateWorkReportsForPeriod(
  prisma: PrismaClient,
  payCycleId: number,
  periodStart: Date,
  periodEnd: Date,
  createdById: number
): Promise<WorkReportDto[]> {
  const payCycle = await prisma.payCycle.findUnique({ where: { id: payCycleId } });
  if (!payCycle) throw ApiError.notFound("Pay cycle not found");
  if (periodEnd < periodStart) throw ApiError.badRequest("periodEnd must be on or after periodStart");

  const employees = await prisma.employee.findMany({ where: { payCycleId, status: "Active" } });
  const results: WorkReportDto[] = [];

  for (const employee of employees) {
    const existing = await prisma.workReport.findUnique({
      where: { employeeId_periodStart_periodEnd: { employeeId: employee.id, periodStart, periodEnd } },
    });
    if (existing && existing.status !== "DRAFT") {
      // Already locked in by HR/Payroll — don't overwrite.
      results.push(toWorkReportDto(await prisma.workReport.findUniqueOrThrow({ where: { id: existing.id }, include: workReportInclude })));
      continue;
    }

    const assignments = await prisma.dutyScheduleAssignment.findMany({
      where: { employeeId: employee.id, date: { gte: periodStart, lte: periodEnd } },
      include: assignmentForAggregation.include,
    });

    let regularMinutes = 0;
    let extraMinutes = 0;
    for (const assignment of assignments) {
      const { regular, extra } = splitDayMinutes(assignment);
      regularMinutes += regular;
      extraMinutes += extra;
    }

    const regularHours = round2(regularMinutes / 60);
    const extraHours = round2(extraMinutes / 60);
    const totalHours = round2(regularHours + extraHours);

    const report = await prisma.workReport.upsert({
      where: { employeeId_periodStart_periodEnd: { employeeId: employee.id, periodStart, periodEnd } },
      create: {
        employeeId: employee.id,
        periodStart,
        periodEnd,
        totalHours,
        regularHours,
        extraHours,
        status: "DRAFT",
        createdById,
      },
      update: { totalHours, regularHours, extraHours },
      include: workReportInclude,
    });
    results.push(toWorkReportDto(report));
  }

  return results;
}

export async function listWorkReports(prisma: PrismaClient, query: ListWorkReportsQuery): Promise<WorkReportDto[]> {
  const where: Prisma.WorkReportWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.employeeId ? { employeeId: query.employeeId } : {}),
    ...(query.payCycleId ? { employee: { payCycleId: query.payCycleId } } : {}),
  };
  const reports = await prisma.workReport.findMany({
    where,
    include: workReportInclude,
    orderBy: [{ periodStart: "desc" }, { employeeId: "asc" }],
  });
  return reports.map(toWorkReportDto);
}

export async function getWorkReportById(prisma: PrismaClient, id: number): Promise<WorkReportDto> {
  const report = await prisma.workReport.findUnique({ where: { id }, include: workReportInclude });
  if (!report) throw ApiError.notFound("Work report not found");
  return toWorkReportDto(report);
}

// Stage 2: HR approval + lockout. Once approved, the underlying Attendance/BreakLog
// rows for this employee+period can no longer be edited (enforced in
// attendance.service.ts via payrollLock.ts, keyed off this status).
export async function approveWorkReport(prisma: PrismaClient, workReportId: number, hrAdminId: number): Promise<WorkReportDto> {
  const report = await prisma.workReport.findUnique({ where: { id: workReportId } });
  if (!report) throw ApiError.notFound("Work report not found");
  if (report.status !== "DRAFT") {
    throw ApiError.conflict("Only DRAFT work reports can be approved");
  }

  const updated = await prisma.workReport.update({
    where: { id: workReportId },
    data: { status: "HR_APPROVED", approvedById: hrAdminId, approvedAt: new Date() },
    include: workReportInclude,
  });
  return toWorkReportDto(updated);
}

// Lets Admin/HR manually correct the aggregated hours on a report that hasn't been
// paid out yet — e.g. an attendance gap the auto-aggregation couldn't fill in.
// Once PAYROLL_PROCESSED (a payslip exists), the figures are locked in.
export async function updateWorkReport(
  prisma: PrismaClient,
  workReportId: number,
  input: { regularHours: number; extraHours: number }
): Promise<WorkReportDto> {
  const report = await prisma.workReport.findUnique({ where: { id: workReportId } });
  if (!report) throw ApiError.notFound("Work report not found");
  if (report.status === "PAYROLL_PROCESSED" || report.payslipId !== null) {
    throw ApiError.conflict("Cannot edit a work report that already has a payslip generated");
  }

  const totalHours = round2(input.regularHours + input.extraHours);
  const updated = await prisma.workReport.update({
    where: { id: workReportId },
    data: { regularHours: input.regularHours, extraHours: input.extraHours, totalHours },
    include: workReportInclude,
  });
  return toWorkReportDto(updated);
}

// Admin-only cleanup for a DRAFT/HR_APPROVED report entered or approved in error.
// Once a payslip has been generated for it (status PAYROLL_PROCESSED / payslipId set),
// it's part of a payroll run's financial record and can no longer be removed here.
export async function deleteWorkReport(prisma: PrismaClient, workReportId: number): Promise<void> {
  const report = await prisma.workReport.findUnique({ where: { id: workReportId } });
  if (!report) throw ApiError.notFound("Work report not found");
  if (report.status === "PAYROLL_PROCESSED" || report.payslipId !== null) {
    throw ApiError.conflict("Cannot delete a work report that already has a payslip generated");
  }

  await prisma.workReport.delete({ where: { id: workReportId } });
}
