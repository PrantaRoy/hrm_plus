import { PrismaClient } from "../../../generated/tenant";
import { getStorageDriver } from "../../storage";

// Scope: generates a downloadable payload shaped like IRD's Employment Information
// (payday filing) submission — NOT a live API call to IRD, which would require
// IRD-issued API credentials this project doesn't have. Finance downloads this file
// and files it manually. Recorded via AuditLog (fileUrl/fileKey in metadata) rather
// than a new schema field, since AuditLog already exists as the generic
// action-record for this kind of thing.
export async function prepareIrdPaydayFiling(prisma: PrismaClient, payrollRunId: number): Promise<{ fileUrl: string; fileKey: string }> {
  const run = await prisma.payrollRun.findUniqueOrThrow({
    where: { id: payrollRunId },
    include: { payslips: { include: { employee: true } } },
  });

  const payload = {
    employerFilingType: "payday",
    payPeriodStart: run.periodStart.toISOString().slice(0, 10),
    payPeriodEnd: run.periodEnd.toISOString().slice(0, 10),
    paymentDate: run.paymentDate.toISOString().slice(0, 10),
    employees: run.payslips.map((p) => ({
      employeeCode: p.employee.employeeCode,
      firstName: p.employee.firstName,
      lastName: p.employee.lastName,
      irdNumber: p.employee.irdNumber ?? null,
      grossEarnings: Number(p.grossPay),
      payeDeducted: Number(p.taxDeductions),
      netPay: Number(p.netPay),
    })),
  };

  const buffer = Buffer.from(JSON.stringify(payload, null, 2), "utf-8");
  const stored = await getStorageDriver().save({
    buffer,
    originalName: `ird-payday-filing-run-${payrollRunId}.json`,
    mimeType: "application/json",
    folder: "ird-payday-filing",
  });

  await prisma.auditLog.create({
    data: {
      action: "IRD_PAYDAY_FILING_PREPARED",
      entityType: "PayrollRun",
      entityId: payrollRunId,
      metadata: { fileUrl: stored.url, fileKey: stored.key },
    },
  });

  return { fileUrl: stored.url, fileKey: stored.key };
}

export async function getLatestIrdPaydayFiling(prisma: PrismaClient, payrollRunId: number): Promise<{ fileUrl: string } | null> {
  const log = await prisma.auditLog.findFirst({
    where: { action: "IRD_PAYDAY_FILING_PREPARED", entityType: "PayrollRun", entityId: payrollRunId },
    orderBy: { createdAt: "desc" },
  });
  if (!log) return null;
  const metadata = log.metadata as { fileUrl?: string } | null;
  return metadata?.fileUrl ? { fileUrl: metadata.fileUrl } : null;
}
