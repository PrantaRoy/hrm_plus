import { PrismaClient } from "../../../generated/tenant";
import { ApiError } from "../../utils/ApiError";
import { toDateOnlyUTC } from "../../utils/date";

// Called from attendance.service.ts's write paths (checkIn, checkOut,
// setManualAttendance, startBreak, endBreak). Once a WorkReport covering an
// employee's date has been HR_APPROVED (or already PAYROLL_PROCESSED), the
// underlying Attendance/BreakLog rows for that day must not change — otherwise
// hours HR signed off on, or a payslip already generated from them, would go
// stale silently.
export async function assertNotPayrollLocked(prisma: PrismaClient, employeeId: number, date: Date): Promise<void> {
  const day = toDateOnlyUTC(date);
  const locked = await prisma.workReport.findFirst({
    where: {
      employeeId,
      status: { in: ["HR_APPROVED", "PAYROLL_PROCESSED"] },
      periodStart: { lte: day },
      periodEnd: { gte: day },
    },
  });
  if (locked) {
    throw ApiError.conflict(
      `Attendance is locked for this date — it falls inside an approved work report (#${locked.id}, ${locked.status})`
    );
  }
}
