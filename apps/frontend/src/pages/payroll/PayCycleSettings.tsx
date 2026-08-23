import { useEffect, useState } from "react";
import { EmployeeDto, PAY_CYCLE_FREQUENCIES, PayCycleDto } from "@hrm-plus/shared";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import { assignEmployeesToPayCycle, createPayCycle, listPayCycles, updatePayCycle } from "../../api/payroll";
import { listEmployees } from "../../api/employees";

export default function PayCycleSettings() {
  const [payCycles, setPayCycles] = useState<PayCycleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<(typeof PAY_CYCLE_FREQUENCIES)[number]>("FORTNIGHTLY");
  const [submitting, setSubmitting] = useState(false);

  const [assignTarget, setAssignTarget] = useState<PayCycleDto | null>(null);
  const [assignEmployees, setAssignEmployees] = useState<EmployeeDto[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  function refresh() {
    setLoading(true);
    listPayCycles()
      .then(setPayCycles)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load pay cycles"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleCreate() {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createPayCycle({ name: name.trim(), frequency });
      setName("");
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to create pay cycle");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(payCycle: PayCycleDto) {
    try {
      await updatePayCycle(payCycle.id, { status: payCycle.status === "Active" ? "Inactive" : "Active" });
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to update pay cycle");
    }
  }

  function openAssignModal(payCycle: PayCycleDto) {
    setAssignTarget(payCycle);
    setSelectedIds(new Set());
    setAssignError(null);
    setAssignLoading(true);
    listEmployees({ pageSize: 500 })
      .then((res) => setAssignEmployees(res.items))
      .catch(() => setAssignEmployees([]))
      .finally(() => setAssignLoading(false));
  }

  function closeAssignModal() {
    setAssignTarget(null);
    setAssignEmployees([]);
    setSelectedIds(new Set());
    setAssignError(null);
  }

  function toggleSelected(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAssignSubmit() {
    if (!assignTarget || selectedIds.size === 0) return;
    setAssignSubmitting(true);
    setAssignError(null);
    try {
      await assignEmployeesToPayCycle(assignTarget.id, Array.from(selectedIds));
      closeAssignModal();
      refresh();
    } catch (err: any) {
      setAssignError(err.response?.data?.error?.message ?? "Failed to assign employees");
    } finally {
      setAssignSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Pay Cycles" description="Define the pay-frequency groups employees are assigned to." />

      <Card>
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}
        <div className="flex items-end gap-3 mb-5">
          <Field label="Name" className="w-64">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard Fortnightly" />
          </Field>
          <Field label="Frequency" className="w-48">
            <Select value={frequency} onChange={(e) => setFrequency(e.target.value as typeof frequency)}>
              {PAY_CYCLE_FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
          </Field>
          <Button onClick={handleCreate} isLoading={submitting}>
            Add Pay Cycle
          </Button>
        </div>

        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Frequency</TableHeaderCell>
              <TableHeaderCell>Employees</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-400 py-6">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading && payCycles.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-400 py-6">
                  No pay cycles yet.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              payCycles.map((pc) => (
                <TableRow key={pc.id}>
                  <TableCell className="font-medium text-slate-900">{pc.name}</TableCell>
                  <TableCell>
                    <Badge>{pc.frequency}</Badge>
                  </TableCell>
                  <TableCell>{pc.employeeCount}</TableCell>
                  <TableCell>
                    <StatusPill status={pc.status} />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="secondary" onClick={() => openAssignModal(pc)}>
                      Assign Employees
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => toggleStatus(pc)}>
                      {pc.status === "Active" ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </tbody>
        </Table>
      </Card>

      <Modal
        open={assignTarget !== null}
        onClose={closeAssignModal}
        title={`Assign Employees — ${assignTarget?.name ?? ""}`}
        description="Select employees to attach to this pay cycle. Employees already on another cycle will be moved to this one."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeAssignModal}>
              Cancel
            </Button>
            <Button onClick={handleAssignSubmit} isLoading={assignSubmitting} disabled={selectedIds.size === 0}>
              Assign {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
            </Button>
          </>
        }
      >
        {assignError && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {assignError}
          </div>
        )}
        {assignLoading && <p className="text-sm text-slate-400 text-center py-6">Loading employees...</p>}
        {!assignLoading && assignEmployees.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">No employees found.</p>
        )}
        {!assignLoading && assignEmployees.length > 0 && (
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {assignEmployees.map((emp) => (
              <label
                key={emp.id}
                className="flex items-center gap-3 py-2 px-1 cursor-pointer hover:bg-slate-50"
              >
                <Checkbox checked={selectedIds.has(emp.id)} onChange={() => toggleSelected(emp.id)} />
                <div className="flex-1">
                  <p className="text-sm text-slate-900">
                    {emp.firstName} {emp.lastName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {emp.employeeCode}
                    {emp.departmentName ? ` · ${emp.departmentName}` : ""}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
