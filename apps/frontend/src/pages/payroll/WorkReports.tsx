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
import {
  approveWorkReport,
  deleteWorkReport,
  generateWorkReports,
  listPayCycles,
  listWorkReports,
  updateWorkReport,
} from "../../api/payroll";

export default function WorkReports() {
  const { user } = useAuth();
  const isHr = user?.role === "Admin" || user?.role === "HR";
  const isAdmin = user?.role === "Admin";

  const [payCycles, setPayCycles] = useState<PayCycleDto[]>([]);
  const [payCycleId, setPayCycleId] = useState<number | null>(null);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [reports, setReports] = useState<WorkReportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRegular, setEditRegular] = useState("");
  const [editExtra, setEditExtra] = useState("");

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

  function startEdit(r: WorkReportDto) {
    setEditingId(r.id);
    setEditRegular(String(r.regularHours));
    setEditExtra(String(r.extraHours));
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleSaveEdit(id: number) {
    const regularHours = Number(editRegular);
    const extraHours = Number(editExtra);
    if (Number.isNaN(regularHours) || Number.isNaN(extraHours) || regularHours < 0 || extraHours < 0) {
      setError("Hours must be non-negative numbers");
      return;
    }
    setActingId(id);
    setError(null);
    try {
      await updateWorkReport(id, { regularHours, extraHours });
      setEditingId(null);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to update work report");
    } finally {
      setActingId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this work report?")) return;
    setActingId(id);
    setError(null);
    try {
      await deleteWorkReport(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to delete work report");
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
                  {editingId === r.id ? (
                    <>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-20"
                          value={editRegular}
                          onChange={(e) => setEditRegular(e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-20"
                          value={editExtra}
                          onChange={(e) => setEditExtra(e.target.value)}
                        />
                      </TableCell>
                      <TableCell>{(Number(editRegular || 0) + Number(editExtra || 0)).toFixed(2)}</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>{r.regularHours.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge color={r.extraHours > 0 ? "amber" : "slate"}>{r.extraHours.toFixed(2)}</Badge>
                      </TableCell>
                      <TableCell>{r.totalHours.toFixed(2)}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <StatusPill status={r.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {editingId === r.id ? (
                        <>
                          <Button size="sm" isLoading={actingId === r.id} onClick={() => handleSaveEdit(r.id)}>
                            Save
                          </Button>
                          <Button size="sm" variant="secondary" onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          {r.status === "DRAFT" && isHr && (
                            <Button size="sm" isLoading={actingId === r.id} onClick={() => handleApprove(r.id)}>
                              Approve
                            </Button>
                          )}
                          {r.status !== "PAYROLL_PROCESSED" && isHr && (
                            <Button size="sm" variant="secondary" onClick={() => startEdit(r)}>
                              Edit
                            </Button>
                          )}
                          {r.status !== "PAYROLL_PROCESSED" && isAdmin && (
                            <Button
                              size="sm"
                              variant="danger"
                              isLoading={actingId === r.id}
                              onClick={() => handleDelete(r.id)}
                            >
                              Delete
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
