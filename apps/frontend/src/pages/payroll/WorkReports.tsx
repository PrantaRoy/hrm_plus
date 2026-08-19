import { useEffect, useState } from "react";
import { PayCycleDto, WorkReportDto } from "@hrm-plus/shared";
import {
  Badge,
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
import { useAuth } from "../../auth/AuthContext";
import { approveWorkReport, generateWorkReports, listPayCycles, listWorkReports } from "../../api/payroll";

export default function WorkReports() {
  const { user } = useAuth();
  const isHr = user?.role === "Admin" || user?.role === "HR";

  const [payCycles, setPayCycles] = useState<PayCycleDto[]>([]);
  const [payCycleId, setPayCycleId] = useState<number | null>(null);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [reports, setReports] = useState<WorkReportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  function refresh() {
    setLoading(true);
    listWorkReports()
      .then(setReports)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load work reports"))
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
    if (payCycleId === null || !periodStart || !periodEnd) return;
    setGenerating(true);
    setError(null);
    try {
      await generateWorkReports({ payCycleId, periodStart, periodEnd });
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to generate work reports");
    } finally {
      setGenerating(false);
    }
  }

  async function handleApprove(id: number) {
    setActingId(id);
    setError(null);
    try {
      await approveWorkReport(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to approve work report");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Work Reports"
        description="Hours auto-aggregated from attendance for the pay period. HR approval locks the underlying attendance records."
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
          <Field label="Period start" className="w-44">
            <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </Field>
          <Field label="Period end" className="w-44">
            <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </Field>
          <Button onClick={handleGenerate} isLoading={generating}>
            Generate from Attendance
          </Button>
        </div>

        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Employee</TableHeaderCell>
              <TableHeaderCell>Period</TableHeaderCell>
              <TableHeaderCell>Regular</TableHeaderCell>
              <TableHeaderCell>Extra</TableHeaderCell>
              <TableHeaderCell>Total</TableHeaderCell>
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
            {!loading && reports.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-400 py-6">
                  No work reports yet — generate them from attendance for a pay period above.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              reports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {r.employeeName} <span className="text-slate-400">({r.employeeCode})</span>
                  </TableCell>
                  <TableCell>
                    {r.periodStart.slice(0, 10)} → {r.periodEnd.slice(0, 10)}
                  </TableCell>
                  <TableCell>{r.regularHours.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge color={r.extraHours > 0 ? "amber" : "slate"}>{r.extraHours.toFixed(2)}</Badge>
                  </TableCell>
                  <TableCell>{r.totalHours.toFixed(2)}</TableCell>
                  <TableCell>
                    <StatusPill status={r.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === "DRAFT" && isHr && (
                      <Button size="sm" isLoading={actingId === r.id} onClick={() => handleApprove(r.id)}>
                        Approve
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
