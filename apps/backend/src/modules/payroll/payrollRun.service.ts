import { PrismaClient, Prisma } from "../../../generated/tenant";
import { BankExportFormat, ListPayrollRunsQuery, PayrollRunDto } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { resolveEffectivePayRate } from "./payRate.service";
import { getOrCreatePayrollSettings } from "./payrollSettings.service";
import { calculateStatutoryDeductions } from "./statutoryTax";
import { generateBankExportFile as buildBankExportFile, BankExportLine } from "./bankExport";
import { payrollRunInclude, toPayrollRunDto } from "./payrollRun.mapper";
import { payslipInclude, toPayslipDto } from "./payslip.mapper";
import { enqueuePayslipPdfJob } from "../../queue/payslipPdf.queue";
import { enqueueIrdPaydayFilingJob } from "../../queue/irdPaydayFiling.queue";

interface LineItemInput {
  description: string;
  hours: number;
  rate: number;
  total: number;
}

// Stage 3: for one employee, resolve their effective rate as of periodEnd and build
// the PayslipLineItems + gross pay from a HR_APPROVED WorkReport's hours. HOURLY
// employees are paid regularHours*rate and extraHours*rate*overtimeMultiplier;
// SALARY employees are paid a flat baseRate for the period regardless of hours
// (baseRate is treated as the per-pay-period salary amount), with hours recorded as
// a single reference line item rather than driving the pay calculation.
function buildLineItems(
  rateType: string,
  baseRate: number,
  regularHours: number,
  extraHours: number,
  overtimeMultiplier: number
): LineItemInput[] {
  if (rateType === "SALARY") {
    return [
      {
        description: "Salary",
        hours: regularHours + extraHours,
        rate: baseRate,
        total: baseRate,
      },
    ];
  }

  const items: LineItemInput[] = [
    { description: "Regular hours", hours: regularHours, rate: baseRate, total: Math.round(regularHours * baseRate * 100) / 100 },
  ];
  if (extraHours > 0) {
    const overtimeRate = Math.round(baseRate * overtimeMultiplier * 100) / 100;
    items.push({
      description: `Overtime (${overtimeMultiplier}x)`,
      hours: extraHours,
      rate: overtimeRate,
      total: Math.round(extraHours * overtimeRate * 100) / 100,
    });
  }
  return items;
}

export async function generateDraftPayrollRun(
  prisma: PrismaClient,
  payCycleId: number,
  periodStart: Date,
  periodEnd: Date,
  paymentDate: Date,
  processedById: number
): Promise<PayrollRunDto> {
  const payCycle = await prisma.payCycle.findUnique({ where: { id: payCycleId } });
  if (!payCycle) throw ApiError.notFound("Pay cycle not found");

  const workReports = await prisma.workReport.findMany({
    where: { status: "HR_APPROVED", periodStart, periodEnd, employee: { payCycleId } },
    include: { employee: true },
  });
  if (workReports.length === 0) {
    throw ApiError.badRequest("No HR-approved work reports found for this pay cycle and period");
  }

  const settings = await getOrCreatePayrollSettings(prisma);
  const overtimeMultiplier = Number(settings.overtimeMultiplier);
  const region = settings.region as "NZ" | "AU";

  const runId = await prisma.$transaction(async (tx) => {
    const run = await tx.payrollRun.create({
      data: { payCycleId, periodStart, periodEnd, paymentDate, processedById, totalGrossPay: 0, totalNetPay: 0 },
    });

    let totalGrossPay = 0;
    let totalNetPay = 0;

    for (const report of workReports) {
      const payRate = await resolveEffectivePayRate(tx as unknown as PrismaClient, report.employeeId, periodEnd);
      const lineItems = buildLineItems(
        payRate.rateType,
        Number(payRate.baseRate),
        Number(report.regularHours),
        Number(report.extraHours),
        overtimeMultiplier
      );
      const grossPay = Math.round(lineItems.reduce((sum, item) => sum + item.total, 0) * 100) / 100;
      const taxDeductions = calculateStatutoryDeductions(grossPay, region);
      const netPay = Math.round((grossPay - taxDeductions) * 100) / 100;

      const payslip = await tx.payslip.create({
        data: {
          payrollRunId: run.id,
          employeeId: report.employeeId,
          grossPay,
          taxDeductions,
          netPay,
          lineItems: { create: lineItems },
        },
      });

      await tx.workReport.update({
        where: { id: report.id },
        data: { status: "PAYROLL_PROCESSED", payslipId: payslip.id },
      });

      totalGrossPay += grossPay;
      totalNetPay += netPay;
    }

    await tx.payrollRun.update({
      where: { id: run.id },
      data: {
        totalGrossPay: Math.round(totalGrossPay * 100) / 100,
        totalNetPay: Math.round(totalNetPay * 100) / 100,
      },
    });

    return run.id;
  });

  return getPayrollRunById(prisma, runId);
}

export async function listPayrollRuns(prisma: PrismaClient, query: ListPayrollRunsQuery): Promise<PayrollRunDto[]> {
  const where: Prisma.PayrollRunWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.payCycleId ? { payCycleId: query.payCycleId } : {}),
  };
  const runs = await prisma.payrollRun.findMany({ where, include: payrollRunInclude, orderBy: { createdAt: "desc" } });
  return runs.map(toPayrollRunDto);
}

export async function getPayrollRunById(prisma: PrismaClient, id: number): Promise<PayrollRunDto> {
  const run = await prisma.payrollRun.findUnique({ where: { id }, include: payrollRunInclude });
  if (!run) throw ApiError.notFound("Payroll run not found");
  return toPayrollRunDto(run);
}

export async function listPayslipsForRun(prisma: PrismaClient, payrollRunId: number) {
  const payslips = await prisma.payslip.findMany({
    where: { payrollRunId },
    include: payslipInclude,
    orderBy: { employeeId: "asc" },
  });
  return payslips.map(toPayslipDto);
}

// Stage 4a: DRAFT -> PENDING_PAYMENT.
export async function submitPayrollForPayment(prisma: PrismaClient, payrollRunId: number, submittedById: number): Promise<PayrollRunDto> {
  const run = await prisma.payrollRun.findUnique({ where: { id: payrollRunId } });
  if (!run) throw ApiError.notFound("Payroll run not found");
  if (run.status !== "DRAFT") throw ApiError.conflict("Only DRAFT payroll runs can be submitted for payment");

  await prisma.payrollRun.update({
    where: { id: payrollRunId },
    data: { status: "PENDING_PAYMENT", submittedById, submittedAt: new Date() },
  });
  return getPayrollRunById(prisma, payrollRunId);
}

// Stage 4b: bulk banking export file for a run pending payment.
export async function exportBankFile(prisma: PrismaClient, payrollRunId: number, format: BankExportFormat) {
  const run = await prisma.payrollRun.findUnique({ where: { id: payrollRunId } });
  if (!run) throw ApiError.notFound("Payroll run not found");
  if (run.status !== "PENDING_PAYMENT" && run.status !== "PAID") {
    throw ApiError.conflict("Bank export is only available once a run has been submitted for payment");
  }

  const payslips = await prisma.payslip.findMany({ where: { payrollRunId }, include: { employee: true } });
  const lines: BankExportLine[] = payslips.map((p) => ({
    employeeCode: p.employee.employeeCode,
    employeeName: `${p.employee.firstName} ${p.employee.lastName}`,
    netPay: Number(p.netPay),
  }));
  return buildBankExportFile(lines, format);
}

// Stage 5: Finance/Admin decision on a PENDING_PAYMENT run.
// Approve -> finalizePayrollRun (PAID, publish payslips, queue PDF + IRD jobs).
// Reject -> run marked REJECTED (kept for audit), its DRAFT payslips are discarded
// and the source WorkReports revert to HR_APPROVED so Payroll can regenerate a
// corrected run for the same period.
export async function decidePayrollRunPayment(
  prisma: PrismaClient,
  payrollRunId: number,
  decision: "Approve" | "Reject",
  actingUserId: number,
  tenantSlug: string,
  reason?: string
): Promise<PayrollRunDto> {
  const run = await prisma.payrollRun.findUnique({ where: { id: payrollRunId } });
  if (!run) throw ApiError.notFound("Payroll run not found");
  if (run.status !== "PENDING_PAYMENT") {
    throw ApiError.conflict("Only payroll runs pending payment can be decided");
  }

  if (decision === "Reject") {
    await prisma.$transaction(async (tx) => {
      const payslips = await tx.payslip.findMany({ where: { payrollRunId }, include: { workReport: true } });
      for (const payslip of payslips) {
        if (payslip.workReport) {
          await tx.workReport.update({
            where: { id: payslip.workReport.id },
            data: { status: "HR_APPROVED", payslipId: null },
          });
        }
        await tx.payslipLineItem.deleteMany({ where: { payslipId: payslip.id } });
        await tx.payslip.delete({ where: { id: payslip.id } });
      }
      await tx.payrollRun.update({
        where: { id: payrollRunId },
        data: { status: "REJECTED", decidedById: actingUserId, decidedAt: new Date(), rejectionReason: reason ?? null },
      });
    });
    return getPayrollRunById(prisma, payrollRunId);
  }

  const payslipIds = await prisma.$transaction(async (tx) => {
    await tx.payrollRun.update({
      where: { id: payrollRunId },
      data: { status: "PAID", decidedById: actingUserId, decidedAt: new Date() },
    });
    await tx.payslip.updateMany({ where: { payrollRunId }, data: { status: "PUBLISHED" } });
    return (await tx.payslip.findMany({ where: { payrollRunId }, select: { id: true } })).map((p) => p.id);
  });

  for (const payslipId of payslipIds) {
    await enqueuePayslipPdfJob({ tenantSlug, payslipId });
  }
  await enqueueIrdPaydayFilingJob({ tenantSlug, payrollRunId });

  return getPayrollRunById(prisma, payrollRunId);
}
