import { PrismaClient } from "../../../generated/tenant";
import { renderAndStorePayslipPdf } from "./payslip.render";

export async function processPayslipPdfJob(prisma: PrismaClient, payslipId: number, companyName: string): Promise<void> {
  const payslip = await prisma.payslip.findUnique({ where: { id: payslipId } });
  if (!payslip || payslip.pdfUrl) return; // already generated or gone — idempotent
  await renderAndStorePayslipPdf(prisma, payslipId, companyName);
}
