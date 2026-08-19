import { Prisma } from "../../../generated/tenant";
import { PayslipDto } from "@hrm-plus/shared";

const payslipWithRelations = Prisma.validator<Prisma.PayslipDefaultArgs>()({
  include: { employee: true, lineItems: true },
});
export type PayslipWithRelations = Prisma.PayslipGetPayload<typeof payslipWithRelations>;
export const payslipInclude = payslipWithRelations.include;

export function toPayslipDto(payslip: PayslipWithRelations): PayslipDto {
  return {
    id: payslip.id,
    payrollRunId: payslip.payrollRunId,
    employeeId: payslip.employeeId,
    employeeName: `${payslip.employee.firstName} ${payslip.employee.lastName}`,
    employeeCode: payslip.employee.employeeCode,
    grossPay: Number(payslip.grossPay),
    taxDeductions: Number(payslip.taxDeductions),
    netPay: Number(payslip.netPay),
    status: payslip.status as PayslipDto["status"],
    pdfUrl: payslip.pdfUrl,
    lineItems: payslip.lineItems.map((item) => ({
      id: item.id,
      description: item.description,
      hours: Number(item.hours),
      rate: Number(item.rate),
      total: Number(item.total),
    })),
    createdAt: payslip.createdAt.toISOString(),
    updatedAt: payslip.updatedAt.toISOString(),
  };
}
