import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BANK_EXPORT_FORMATS, BankExportFormat, PayrollRunDto, PayslipDto } from "@hrm-plus/shared";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  Select,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Textarea,
} from "@hrm-plus/ui";
import { useAuth } from "../../auth/AuthContext";
import { formatCurrency } from "../../utils/currency";
import { resolveFileUrl } from "../../utils/fileUrl";
import {
  approvePayrollRunPayment,
  downloadBankExport,
  getIrdPaydayFiling,
  getPayrollRun,
  listRunPayslips,
  rejectPayrollRunPayment,
} from "../../api/payroll";

function triggerDownload(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function PayrollRunDetail() {
  const { id } = useParams<{ id: string }>();
  const runId = Number(id);
  const { user } = useAuth();
  const isFinance = user?.role === "Admin" || user?.role === "Finance";

  const [run, setRun] = useState<PayrollRunDto | null>(null);
  const [payslips, setPayslips] = useState<PayslipDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);
  const [format, setFormat] = useState<BankExportFormat>("NZ_DIRECT_CREDIT_CSV");

  function refresh() {
    setLoading(true);
    Promise.all([getPayrollRun(runId), listRunPayslips(runId)])
      .then(([r, p]) => {
        setRun(r);
        setPayslips(p);
      })
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load payroll run"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [runId]);

  async function handleDecision(decision: "approve" | "reject") {
    setActing(true);
    setError(null);
    try {
      if (decision === "approve") await approvePayrollRunPayment(runId, { reason: reason || undefined });
      else await rejectPayrollRunPayment(runId, { reason: reason || undefined });
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to record decision");
    } finally {
      setActing(false);
    }
  }

  async function handleBankExport() {
    try {
      const content = await downloadBankExport(runId, format);
      triggerDownload(content, format === "NZ_DIRECT_CREDIT_CSV" ? "nz-direct-credit.csv" : "payroll.aba", "text/plain");
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to export bank file");
    }
  }

  async function handleIrdFiling() {
    try {
      const filing = await getIrdPaydayFiling(runId);
      window.open(resolveFileUrl(filing.fileUrl) ?? filing.fileUrl, "_blank");
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "IRD payday filing not ready yet — it's prepared in the background once payment is approved.");
    }
  }

  if (loading || !run) {
    return <div className="text-slate-400 py-10 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Payroll Run — ${run.payCycleName}`}
        description={`${run.periodStart.slice(0, 10)} → ${run.periodEnd.slice(0, 10)} · Payment date ${run.paymentDate.slice(0, 10)}`}
      />

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}

      <Card>
        <div className="flex flex-wrap items-center gap-6 mb-2">
          <div>
            <div className="text-xs text-slate-400">Status</div>
            <StatusPill status={run.status} />
          </div>
          <div>
            <div className="text-xs text-slate-400">Total gross</div>
            <div className="font-medium">{formatCurrency(run.totalGrossPay)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Total net</div>
            <div className="font-medium">{formatCurrency(run.totalNetPay)}</div>
          </div>
          {run.rejectionReason && (
            <div>
              <div className="text-xs text-slate-400">Rejection reason</div>
              <div className="font-medium text-red-600">{run.rejectionReason}</div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-3 mt-4">
          <Select value={format} onChange={(e) => setFormat(e.target.value as BankExportFormat)} className="w-56">
            {BANK_EXPORT_FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
          <Button variant="secondary" onClick={handleBankExport}>
            Download Bank Export
          </Button>
          {run.status === "PAID" && (
            <Button variant="secondary" onClick={handleIrdFiling}>
              Open IRD Payday Filing
            </Button>
          )}
        </div>

        {isFinance && run.status === "PENDING_PAYMENT" && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <Textarea
              rows={2}
              placeholder="Optional comment / rejection reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mb-3 max-w-lg"
            />
            <Button className="mr-2" isLoading={acting} onClick={() => handleDecision("approve")}>
              Approve Payment
            </Button>
            <Button variant="danger" isLoading={acting} onClick={() => handleDecision("reject")}>
              Reject
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Employee</TableHeaderCell>
              <TableHeaderCell>Gross</TableHeaderCell>
              <TableHeaderCell>Tax</TableHeaderCell>
              <TableHeaderCell>Net</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Payslip</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {payslips.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  {p.employeeName} <span className="text-slate-400">({p.employeeCode})</span>
                </TableCell>
                <TableCell>{formatCurrency(p.grossPay)}</TableCell>
                <TableCell>{formatCurrency(p.taxDeductions)}</TableCell>
                <TableCell className="font-medium">{formatCurrency(p.netPay)}</TableCell>
                <TableCell>
                  <Badge color={p.status === "PUBLISHED" ? "green" : "slate"}>{p.status}</Badge>
                </TableCell>
                <TableCell>
                  {p.pdfUrl ? (
                    <a href={resolveFileUrl(p.pdfUrl) ?? undefined} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">
                      PDF
                    </a>
                  ) : (
                    <span className="text-slate-400">Generating...</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
