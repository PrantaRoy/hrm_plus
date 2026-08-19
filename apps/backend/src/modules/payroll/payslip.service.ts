import { PrismaClient } from "../../../generated/tenant";
import { PayslipDto } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { payslipInclude, toPayslipDto } from "./payslip.mapper";

export async function listMyPayslips(prisma: PrismaClient, userId: number): Promise<PayslipDto[]> {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw ApiError.notFound("No employee profile linked to this account");

  const payslips = await prisma.payslip.findMany({
    where: { employeeId: employee.id, status: "PUBLISHED" },
    include: payslipInclude,
    orderBy: { createdAt: "desc" },
  });
  return payslips.map(toPayslipDto);
}

export async function getMyPayslipById(prisma: PrismaClient, userId: number, payslipId: number): Promise<PayslipDto> {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw ApiError.notFound("No employee profile linked to this account");

  const payslip = await prisma.payslip.findUnique({ where: { id: payslipId }, include: payslipInclude });
  if (!payslip || payslip.employeeId !== employee.id || payslip.status !== "PUBLISHED") {
    throw ApiError.notFound("Payslip not found");
  }
  return toPayslipDto(payslip);
}
