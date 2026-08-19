import { Prisma } from "../../../generated/tenant";
import { PayrollRunDto } from "@hrm-plus/shared";

const payrollRunWithRelations = Prisma.validator<Prisma.PayrollRunDefaultArgs>()({
  include: {
    payCycle: true,
    processedBy: true,
    submittedBy: true,
    decidedBy: true,
    _count: { select: { payslips: true } },
  },
});
export type PayrollRunWithRelations = Prisma.PayrollRunGetPayload<typeof payrollRunWithRelations>;
export const payrollRunInclude = payrollRunWithRelations.include;

export function toPayrollRunDto(run: PayrollRunWithRelations): PayrollRunDto {
  return {
    id: run.id,
    payCycleId: run.payCycleId,
    payCycleName: run.payCycle.name,
    periodStart: run.periodStart.toISOString(),
    periodEnd: run.periodEnd.toISOString(),
    paymentDate: run.paymentDate.toISOString(),
    status: run.status as PayrollRunDto["status"],
    totalGrossPay: Number(run.totalGrossPay),
    totalNetPay: Number(run.totalNetPay),
    payslipCount: run._count.payslips,
    processedById: run.processedById,
    processedByName: run.processedBy.email,
    submittedById: run.submittedById,
    submittedByName: run.submittedBy?.email ?? null,
    submittedAt: run.submittedAt ? run.submittedAt.toISOString() : null,
    decidedById: run.decidedById,
    decidedByName: run.decidedBy?.email ?? null,
    decidedAt: run.decidedAt ? run.decidedAt.toISOString() : null,
    rejectionReason: run.rejectionReason,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
  };
}
