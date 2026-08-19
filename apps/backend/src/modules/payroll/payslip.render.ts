import { PrismaClient, Prisma } from "../../../generated/tenant";
import { ApiError } from "../../utils/ApiError";
import { getStorageDriver } from "../../storage";
import { renderHtmlToPdfBuffer } from "../../pdf/renderer";

const payslipForRenderInclude = Prisma.validator<Prisma.PayslipDefaultArgs>()({
  include: {
    employee: true,
    lineItems: true,
    payrollRun: { include: { payCycle: true } },
  },
});
type PayslipForRender = Prisma.PayslipGetPayload<typeof payslipForRenderInclude>;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]!));
}

function buildPayslipHtml(payslip: PayslipForRender, companyName: string): string {
  const periodStart = payslip.payrollRun.periodStart.toISOString().slice(0, 10);
  const periodEnd = payslip.payrollRun.periodEnd.toISOString().slice(0, 10);
  const rows = payslip.lineItems
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.description)}</td><td>${Number(item.hours).toFixed(2)}</td><td>${Number(item.rate).toFixed(2)}</td><td>${Number(item.total).toFixed(2)}</td></tr>`
    )
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8" /><style>
    body { font-family: Arial, sans-serif; padding: 32px; color: #1f2933; }
    h1 { font-size: 18px; margin-bottom: 0; }
    .muted { color: #64748b; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .totals { margin-top: 16px; font-size: 14px; }
    .totals div { display: flex; justify-content: space-between; max-width: 260px; padding: 4px 0; }
    .net { font-weight: bold; border-top: 1px solid #1f2933; margin-top: 4px; padding-top: 8px; }
  </style></head><body>
    <h1>${escapeHtml(companyName)}</h1>
    <div class="muted">Payslip for ${escapeHtml(payslip.employee.firstName)} ${escapeHtml(payslip.employee.lastName)} (${escapeHtml(payslip.employee.employeeCode)})</div>
    <div class="muted">Pay period: ${periodStart} to ${periodEnd} — Pay cycle: ${escapeHtml(payslip.payrollRun.payCycle.name)}</div>
    <table>
      <thead><tr><th>Description</th><th>Hours</th><th>Rate</th><th>Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals">
      <div><span>Gross pay</span><span>${Number(payslip.grossPay).toFixed(2)}</span></div>
      <div><span>Tax deductions</span><span>-${Number(payslip.taxDeductions).toFixed(2)}</span></div>
      <div class="net"><span>Net pay</span><span>${Number(payslip.netPay).toFixed(2)}</span></div>
    </div>
  </body></html>`;
}

// Renders the payslip PDF and persists it via the storage driver, saving the
// resulting URL/key back onto the Payslip row. Called from the async
// payslipPdf.processor.ts job triggered once a PayrollRun is finalized (PAID).
export async function renderAndStorePayslipPdf(
  prisma: PrismaClient,
  payslipId: number,
  companyName: string
): Promise<{ pdfUrl: string; pdfKey: string }> {
  const payslip = await prisma.payslip.findUnique({ where: { id: payslipId }, include: payslipForRenderInclude.include });
  if (!payslip) throw ApiError.notFound("Payslip not found");

  const html = buildPayslipHtml(payslip, companyName);
  const pdfBuffer = await renderHtmlToPdfBuffer(html);
  const stored = await getStorageDriver().save({
    buffer: pdfBuffer,
    originalName: `payslip-${payslip.employee.employeeCode}-${payslipId}.pdf`,
    mimeType: "application/pdf",
    folder: "payslips",
  });

  await prisma.payslip.update({ where: { id: payslipId }, data: { pdfUrl: stored.url, pdfKey: stored.key } });
  return { pdfUrl: stored.url, pdfKey: stored.key };
}
