import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PayCycleDto, PayrollRunDto } from "@hrm-plus/shared";
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Select,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import { formatCurrency } from "../../utils/currency";
import { generateDraftPayrollRun, listPayCycles, listPayrollRuns, submitPayrollForPayment } from "../../api/payroll";

export default function PayrollRuns() {
  const [payCycles, setPayCycles] = useState<PayCycleDto[]>([]);
  const [payCycleId, setPayCycleId] = useState<number | null>(null);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [runs, setRuns] = useState<PayrollRunDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  function refresh() {
    setLoading(true);
    listPayrollRuns()
      .then(setRuns)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load payroll runs"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    listPayCycles().then((list) => {
      setPayCycles(list);
      if (list.length > 0) setPayCycleId(list[0].id);
    });
    refresh();
  }, []);

  async function handleGenerate() {
    if (payCycleId === null || !periodStart || !periodEnd || !paymentDate) return;
    setGenerating(true);
    setError(null);
    try {
      await generateDraftPayrollRun({ payCycleId, periodStart, periodEnd, paymentDate });
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to generate payroll run");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(id: number) {
    setActingId(id);
    setError(null);
    try {
      await submitPayrollForPayment(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to submit for payment");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payroll Runs"
        description="Generate a draft run from HR-approved work reports, then submit it for Finance payment approval."
      />

      <Card>
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}
        <div className="flex items-end gap-3 mb-5 flex-wrap">
          <Field label="Pay cycle" className="w-56">
            <Select value={payCycleId ?? ""} onChange={(e) => setPayCycleId(Number(e.target.value))}>
              {payCycles.map((pc) => (
                <option key={pc.id} value={pc.id}>
                  {pc.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Period start" className="w-40">
            <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </Field>
          <Field label="Period end" className="w-40">
            <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </Field>
          <Field label="Payment date" className="w-40">
            <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </Field>
          <Button onClick={handleGenerate} isLoading={generating}>
            Generate Draft Run
          </Button>
        </div>

        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Pay cycle</TableHeaderCell>
              <TableHeaderCell>Period</TableHeaderCell>
              <TableHeaderCell>Payslips</TableHeaderCell>
              <TableHeaderCell>Gross</TableHeaderCell>
              <TableHeaderCell>Net</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-400 py-6">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading && runs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-400 py-6">
                  No payroll runs yet.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              runs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link to={`/payroll/runs/${r.id}`} className="text-brand-700 hover:underline font-medium">
                      {r.payCycleName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {r.periodStart.slice(0, 10)} → {r.periodEnd.slice(0, 10)}
                  </TableCell>
                  <TableCell>{r.payslipCount}</TableCell>
                  <TableCell>{formatCurrency(r.totalGrossPay)}</TableCell>
                  <TableCell>{formatCurrency(r.totalNetPay)}</TableCell>
                  <TableCell>
                    <StatusPill status={r.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === "DRAFT" && (
                      <Button size="sm" isLoading={actingId === r.id} onClick={() => handleSubmit(r.id)}>
                        Submit for Payment
                      </Button>
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
