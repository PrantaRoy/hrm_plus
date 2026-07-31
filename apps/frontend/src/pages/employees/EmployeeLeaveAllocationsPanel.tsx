import { FormEvent, useEffect, useState } from "react";
import { ApproverType, EmployeeLeaveAllocationDto, LeaveTypeDto, RoleDto } from "@hrm-plus/shared";
import { Button, Card, Field, Input, Select, StatusPill, Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@hrm-plus/ui";
import {
  createLeaveAllocation,
  deleteLeaveAllocation,
  listLeaveAllocations,
  updateLeaveAllocation,
} from "../../api/leaveAllocations";
import { listLeaveTypes } from "../../api/leaveTypes";
import { listRoles } from "../../api/roles";

interface StepFormRow {
  approverType: ApproverType;
  roleId: string;
}

interface AllocationForm {
  leaveTypeId: string;
  year: string;
  allocatedDays: number;
  approvalSteps: StepFormRow[];
}

function emptyForm(currentYear: number): AllocationForm {
  return {
    leaveTypeId: "",
    year: String(currentYear),
    allocatedDays: 0,
    approvalSteps: [{ approverType: "ReportingManager", roleId: "" }],
  };
}

function stepChainSummary(allocation: EmployeeLeaveAllocationDto): string {
  if (allocation.approvalSteps.length === 0) return "—";
  return allocation.approvalSteps
    .map((step) => (step.approverType === "ReportingManager" ? "Reporting Manager" : step.roleName ?? "Role"))
    .join(" → ");
}

function ApprovalStepBuilder({
  steps,
  roles,
  onChange,
}: {
  steps: StepFormRow[];
  roles: RoleDto[];
  onChange: (steps: StepFormRow[]) => void;
}) {
  function updateStep(index: number, patch: Partial<StepFormRow>) {
    onChange(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function removeStep(index: number) {
    onChange(steps.filter((_, i) => i !== index));
  }

  function moveStep(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">Approval chain (in order)</label>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="w-5 text-xs text-slate-400">{index + 1}.</span>
          <Select
            value={step.approverType}
            onChange={(e) => updateStep(index, { approverType: e.target.value as ApproverType, roleId: "" })}
            className="max-w-[180px]"
          >
            <option value="ReportingManager">Reporting Manager</option>
            <option value="Role">Role</option>
          </Select>
          {step.approverType === "Role" && (
            <Select
              value={step.roleId}
              onChange={(e) => updateStep(index, { roleId: e.target.value })}
              className="max-w-[180px]"
            >
              <option value="">Select role…</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          )}
          <Button type="button" size="sm" variant="secondary" onClick={() => moveStep(index, -1)} disabled={index === 0}>
            ↑
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => moveStep(index, 1)}
            disabled={index === steps.length - 1}
          >
            ↓
          </Button>
          <Button type="button" size="sm" variant="danger" onClick={() => removeStep(index)}>
            Remove
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => onChange([...steps, { approverType: "ReportingManager", roleId: "" }])}
      >
        Add Step
      </Button>
    </div>
  );
}

export function EmployeeLeaveAllocationsPanel({ employeeId }: { employeeId: number }) {
  const currentYear = new Date().getFullYear();
  const [allocations, setAllocations] = useState<EmployeeLeaveAllocationDto[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<AllocationForm>(emptyForm(currentYear));
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<AllocationForm>(emptyForm(currentYear));

  function refresh() {
    setLoading(true);
    listLeaveAllocations(employeeId)
      .then(setAllocations)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load leave allocations"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [employeeId]);
  useEffect(() => {
    listLeaveTypes().then(setLeaveTypes).catch(() => setLeaveTypes([]));
    listRoles().then(setRoles).catch(() => setRoles([]));
  }, []);

  function validSteps(steps: StepFormRow[]): boolean {
    return steps.length > 0 && steps.every((s) => s.approverType === "ReportingManager" || s.roleId !== "");
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!form.leaveTypeId) {
      setError("Select a leave type");
      return;
    }
    if (!validSteps(form.approvalSteps)) {
      setError("Every 'Role' step needs a role selected");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createLeaveAllocation(employeeId, {
        leaveTypeId: Number(form.leaveTypeId),
        year: Number(form.year),
        allocatedDays: form.allocatedDays,
        approvalSteps: form.approvalSteps.map((s) => ({
          approverType: s.approverType,
          roleId: s.approverType === "Role" ? Number(s.roleId) : undefined,
        })),
      });
      setForm(emptyForm(currentYear));
      setAdding(false);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to add leave allocation");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(allocation: EmployeeLeaveAllocationDto) {
    setEditingId(allocation.id);
    setEditForm({
      leaveTypeId: String(allocation.leaveTypeId),
      year: String(allocation.year),
      allocatedDays: allocation.allocatedDays,
      approvalSteps: allocation.approvalSteps.map((s) => ({
        approverType: s.approverType,
        roleId: s.roleId ? String(s.roleId) : "",
      })),
    });
  }

  async function handleSaveEdit() {
    if (editingId === null) return;
    if (!validSteps(editForm.approvalSteps)) {
      setError("Every 'Role' step needs a role selected");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updateLeaveAllocation(employeeId, editingId, {
        allocatedDays: editForm.allocatedDays,
        approvalSteps: editForm.approvalSteps.map((s) => ({
          approverType: s.approverType,
          roleId: s.approverType === "Role" ? Number(s.roleId) : undefined,
        })),
      });
      setEditingId(null);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to update leave allocation");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this leave allocation?")) return;
    setError(null);
    try {
      await deleteLeaveAllocation(employeeId, id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to delete leave allocation");
    }
  }

  async function handleToggleStatus(allocation: EmployeeLeaveAllocationDto) {
    setError(null);
    try {
      await updateLeaveAllocation(employeeId, allocation.id, {
        status: allocation.status === "Active" ? "Inactive" : "Active",
      });
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to update status");
    }
  }

  return (
    <Card
      title="Leave Allocations"
      description="Yearly leave-type allocations and their approval chains for this employee."
      actions={
        !adding && (
          <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
            Add Allocation
          </Button>
        )
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}

        {adding && (
          <form onSubmit={handleAdd} className="space-y-3 border border-slate-200 rounded-md p-4">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Leave type" required>
                <Select
                  value={form.leaveTypeId}
                  onChange={(e) => {
                    const leaveTypeId = e.target.value;
                    const leaveType = leaveTypes.find((lt) => String(lt.id) === leaveTypeId);
                    setForm((f) => ({
                      ...f,
                      leaveTypeId,
                      allocatedDays: leaveType ? leaveType.assignedDays : f.allocatedDays,
                    }));
                  }}
                >
                  <option value="">Select…</option>
                  {leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Year" required>
                <Input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                />
              </Field>
              <Field label="Allocated days" required>
                <Input
                  type="number"
                  min={0}
                  value={form.allocatedDays}
                  onChange={(e) => setForm((f) => ({ ...f, allocatedDays: Number(e.target.value) }))}
                />
              </Field>
            </div>
            <ApprovalStepBuilder
              steps={form.approvalSteps}
              roles={roles}
              onChange={(approvalSteps) => setForm((f) => ({ ...f, approvalSteps }))}
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" isLoading={submitting}>
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  setAdding(false);
                  setForm(emptyForm(currentYear));
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Leave Type</TableHeaderCell>
              <TableHeaderCell>Year</TableHeaderCell>
              <TableHeaderCell>Allocated</TableHeaderCell>
              <TableHeaderCell>Used</TableHeaderCell>
              <TableHeaderCell>Remaining</TableHeaderCell>
              <TableHeaderCell>Approval Chain</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {loading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-slate-400 py-6">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading && allocations.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-slate-400 py-6">
                  No leave allocations configured.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              allocations.map((allocation) => {
                const editing = editingId === allocation.id;
                return (
                  <TableRow key={allocation.id}>
                    <TableCell>{allocation.leaveTypeName}</TableCell>
                    <TableCell>{allocation.year}</TableCell>
                    <TableCell>
                      {editing ? (
                        <Input
                          type="number"
                          min={0}
                          value={editForm.allocatedDays}
                          onChange={(e) => setEditForm((f) => ({ ...f, allocatedDays: Number(e.target.value) }))}
                          className="w-20"
                        />
                      ) : (
                        allocation.allocatedDays
                      )}
                    </TableCell>
                    <TableCell>{allocation.daysUsed}</TableCell>
                    <TableCell>{allocation.remainingDays}</TableCell>
                    <TableCell>
                      {editing ? (
                        <ApprovalStepBuilder
                          steps={editForm.approvalSteps}
                          roles={roles}
                          onChange={(approvalSteps) => setEditForm((f) => ({ ...f, approvalSteps }))}
                        />
                      ) : (
                        stepChainSummary(allocation)
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusPill status={allocation.status} />
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {editing ? (
                        <>
                          <Button size="sm" onClick={handleSaveEdit} isLoading={submitting} className="mr-2">
                            Save
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => startEdit(allocation)} className="mr-2">
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleToggleStatus(allocation)}
                            className="mr-2"
                          >
                            {allocation.status === "Active" ? "Deactivate" : "Activate"}
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(allocation.id)}>
                            Delete
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
          </tbody>
        </Table>
      </div>
    </Card>
  );
}
