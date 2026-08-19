import { Prisma } from "../../../generated/tenant";
import { WorkReportDto } from "@hrm-plus/shared";

const workReportWithRelations = Prisma.validator<Prisma.WorkReportDefaultArgs>()({
  include: { employee: true, approvedBy: true },
});
export type WorkReportWithRelations = Prisma.WorkReportGetPayload<typeof workReportWithRelations>;
export const workReportInclude = workReportWithRelations.include;

export function toWorkReportDto(report: WorkReportWithRelations): WorkReportDto {
  return {
    id: report.id,
    employeeId: report.employeeId,
    employeeName: `${report.employee.firstName} ${report.employee.lastName}`,
    employeeCode: report.employee.employeeCode,
    periodStart: report.periodStart.toISOString(),
    periodEnd: report.periodEnd.toISOString(),
    totalHours: Number(report.totalHours),
    regularHours: Number(report.regularHours),
    extraHours: Number(report.extraHours),
    status: report.status as WorkReportDto["status"],
    approvedById: report.approvedById,
    approvedByName: report.approvedBy ? report.approvedBy.email : null,
    approvedAt: report.approvedAt ? report.approvedAt.toISOString() : null,
    payslipId: report.payslipId,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}
