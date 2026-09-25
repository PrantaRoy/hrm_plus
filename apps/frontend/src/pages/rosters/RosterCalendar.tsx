import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { DutyScheduleAssignmentDto, DutyScheduleDto, RosterDto } from "@hrm-plus/shared";
import { Button, Card, Field, PageHeader, Select, Spinner, StatusPill, Input } from "@hrm-plus/ui";
import {
  autoGenerateRoster,
  approveRoster,
  bulkDeleteAssignments,
  createAssignment,
  deleteAssignment,
  getRoster,
  listAssignments,
  updateAssignment,
} from "../../api/rosters";
import { listEmployees } from "../../api/employees";
import { listDutySchedules } from "../../api/dutySchedules";
import { CalendarEmployee, CalendarGrid } from "./components/CalendarGrid";
import { AssignmentEditorModal } from "./components/AssignmentEditorModal";

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function enumerateDateKeys(startIso: string, endIso: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${toDateKey(startIso)}T00:00:00Z`);
  const end = new Date(`${toDateKey(endIso)}T00:00:00Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export default function RosterCalendar() {
  const { id } = useParams();
  const rosterId = Number(id);

  const [roster, setRoster] = useState<RosterDto | null>(null);
  const [employees, setEmployees] = useState<CalendarEmployee[]>([]);
  const [assignments, setAssignments] = useState<DutyScheduleAssignmentDto[]>([]);
  const [dutySchedules, setDutySchedules] = useState<DutyScheduleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [editingCell, setEditingCell] = useState<{
    employeeId: number;
    date: string;
    assignment?: DutyScheduleAssignmentDto;
  } | null>(null);
  const [editBusy, setEditBusy] = useState(false);

  const [bulkEmployeeId, setBulkEmployeeId] = useState("");
  const [bulkStartDate, setBulkStartDate] = useState("");
  const [bulkEndDate, setBulkEndDate] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor)
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rosterDto = await getRoster(rosterId);
      setRoster(rosterDto);

      const [employeeRes, assignmentList, dutyScheduleRes] = await Promise.all([
        listEmployees({ page: 1, pageSize: 100, departmentId: rosterDto.departmentId }),
        listAssignments(rosterId, {}),
        listDutySchedules({ page: 1, pageSize: 100, status: "Active" }),
      ]);

      setEmployees(
        employeeRes.items
          .filter((e) => e.status === "Active")
          .map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, code: e.employeeCode }))
      );
      setAssignments(assignmentList);
      setDutySchedules(dutyScheduleRes.items);
    } finally {
      setLoading(false);
    }
  }, [rosterId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const dates = useMemo(
    () => (roster ? enumerateDateKeys(roster.startDate, roster.endDate) : []),
    [roster]
  );

  useEffect(() => {
    if (dates.length > 0 && !bulkStartDate && !bulkEndDate) {
      setBulkStartDate(dates[0]);
      setBulkEndDate(dates[dates.length - 1]);
    }
  }, [dates, bulkStartDate, bulkEndDate]);

  const assignmentsByKey = useMemo(() => {
    const map = new Map<string, DutyScheduleAssignmentDto>();
    for (const assignment of assignments) {
      map.set(`${assignment.employeeId}|${toDateKey(assignment.date)}`, assignment);
    }
    return map;
  }, [assignments]);

  const assignmentsById = useMemo(() => {
    const map = new Map<number, DutyScheduleAssignmentDto>();
    for (const assignment of assignments) {
      map.set(assignment.id, assignment);
    }
    return map;
  }, [assignments]);

  async function handleDragEnd(event: DragEndEvent) {
    setActionError(null);
    const { active, over } = event;
    if (!over) return;

    const draggedAssignment = assignmentsById.get(Number(active.id));
    if (!draggedAssignment) return;

    const [, employeeIdStr, date] = String(over.id).split(":");
    const targetEmployeeId = Number(employeeIdStr);

    if (targetEmployeeId === draggedAssignment.employeeId && date === toDateKey(draggedAssignment.date)) {
      return;
    }

    const occupied = assignmentsByKey.get(`${targetEmployeeId}|${date}`);
    if (occupied) {
      setActionError("That day is already occupied for this employee. Move or clear it first.");
      return;
    }

    try {
      const updated = await updateAssignment(rosterId, draggedAssignment.id, {
        employeeId: targetEmployeeId,
        date,
      });
      setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err: any) {
      setActionError(err.response?.data?.error?.message ?? "Failed to move assignment");
    }
  }

  async function handleAutoGenerate() {
    if (!roster) return;
    const hasAssignments = assignments.length > 0;
    if (hasAssignments && !window.confirm("This roster already has assignments. Regenerate and overwrite them?")) {
      return;
    }
    setActionError(null);
    setBusy(true);
    try {
      await autoGenerateRoster(rosterId, { overwriteExisting: hasAssignments });
      await refresh();
    } catch (err: any) {
      setActionError(err.response?.data?.error?.message ?? "Failed to auto-generate roster");
    } finally {
      setBusy(false);
    }
  }

  async function handleApprove() {
    if (!window.confirm("Approve this roster? Employees will be able to see it and it can no longer be edited.")) {
      return;
    }
    setActionError(null);
    setBusy(true);
    try {
      const updated = await approveRoster(rosterId);
      setRoster(updated);
    } catch (err: any) {
      setActionError(err.response?.data?.error?.message ?? "Failed to approve roster");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteAssignment(assignment: DutyScheduleAssignmentDto) {
    const label = assignment.dutyScheduleName ?? "assignment";
    if (
      !window.confirm(
        `Delete ${assignment.employeeName ?? "this employee"}'s ${label} on ${toDateKey(assignment.date)}?`
      )
    ) {
      return;
    }
    setActionError(null);
    try {
      await deleteAssignment(rosterId, assignment.id);
      setAssignments((prev) => prev.filter((a) => a.id !== assignment.id));
    } catch (err: any) {
      setActionError(err.response?.data?.error?.message ?? "Failed to delete assignment");
    }
  }

  function handleCellClick(employeeId: number, date: string, assignment?: DutyScheduleAssignmentDto) {
    setActionError(null);
    setEditingCell({ employeeId, date, assignment });
  }

  async function handleSaveAssignment(dutyScheduleId: number | null) {
    if (!editingCell) return;
    setEditBusy(true);
    setActionError(null);
    try {
      if (editingCell.assignment) {
        const updated = await updateAssignment(rosterId, editingCell.assignment.id, { dutyScheduleId });
        setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      } else {
        const created = await createAssignment(rosterId, {
          employeeId: editingCell.employeeId,
          date: editingCell.date,
          dutyScheduleId,
        });
        setAssignments((prev) => [...prev, created]);
      }
      setEditingCell(null);
    } catch (err: any) {
      setActionError(err.response?.data?.error?.message ?? "Failed to save assignment");
    } finally {
      setEditBusy(false);
    }
  }

  function countMatching(employeeId: string, startDate: string, endDate: string): number {
    return assignments.filter((a) => {
      if (employeeId && a.employeeId !== Number(employeeId)) return false;
      const d = toDateKey(a.date);
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    }).length;
  }

  async function runBulkDelete(employeeId: string, startDate: string, endDate: string, confirmMessage: string) {
    const count = countMatching(employeeId, startDate, endDate);
    if (count === 0) {
      window.alert("No assignments match that filter.");
      return;
    }
    if (!window.confirm(`${confirmMessage} (${count} assignment${count === 1 ? "" : "s"}). This cannot be undone.`)) {
      return;
    }
    setBulkBusy(true);
    setActionError(null);
    try {
      await bulkDeleteAssignments(rosterId, {
        employeeId: employeeId ? Number(employeeId) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      await refresh();
    } catch (err: any) {
      setActionError(err.response?.data?.error?.message ?? "Failed to delete assignments");
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleBulkDelete() {
    const employeeLabel = bulkEmployeeId
      ? (employees.find((e) => e.id === Number(bulkEmployeeId))?.name ?? "this employee")
      : "all employees";
    await runBulkDelete(
      bulkEmployeeId,
      bulkStartDate,
      bulkEndDate,
      `Delete assignments for ${employeeLabel} from ${bulkStartDate} to ${bulkEndDate}?`
    );
  }

  async function handleDeleteAll() {
    await runBulkDelete("", "", "", "Delete ALL assignments in this roster?");
  }

  if (loading || !roster) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const isDraft = roster.status === "Draft";

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${roster.departmentName ?? "Roster"} · ${roster.periodType}`}
        description={
          <span className="flex items-center gap-2">
            <StatusPill status={roster.status} />
            <Link to="/rosters" className="text-brand-600 hover:underline">
              Back to rosters
            </Link>
          </span>
        }
        actions={
          isDraft ? (
            <div className="flex items-center gap-2">
              <Button variant="secondary" isLoading={busy} onClick={handleAutoGenerate}>
                Auto Roster
              </Button>
              <Button isLoading={busy} disabled={assignments.length === 0} onClick={handleApprove}>
                Approve Roster
              </Button>
            </div>
          ) : undefined
        }
      />

      {actionError && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {actionError}
        </div>
      )}

      {!isDraft && (
        <div className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
          This roster is {roster.status.toLowerCase()}. Employees can already see it — you can still drag to
          reassign, hover a chip to delete it, or use bulk delete below.
        </div>
      )}

      <Card noPadding>
        {employees.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">This department has no active employees.</div>
        ) : (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <CalendarGrid
              employees={employees}
              dates={dates}
              assignmentsByKey={assignmentsByKey}
              onDeleteAssignment={handleDeleteAssignment}
              onCellClick={handleCellClick}
            />
          </DndContext>
        )}
      </Card>

      {employees.length > 0 && (
        <Card
          title="Bulk delete assignments"
          description="Clear a date range for one employee or everyone, or wipe the whole roster."
          actions={
            <Button
              variant="danger"
              size="sm"
              isLoading={bulkBusy}
              disabled={assignments.length === 0}
              onClick={handleDeleteAll}
            >
              Delete All
            </Button>
          }
        >
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Employee">
              <Select value={bulkEmployeeId} onChange={(e) => setBulkEmployeeId(e.target.value)} className="w-48">
                <option value="">All employees</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="From">
              <Input type="date" value={bulkStartDate} onChange={(e) => setBulkStartDate(e.target.value)} />
            </Field>
            <Field label="To">
              <Input type="date" value={bulkEndDate} onChange={(e) => setBulkEndDate(e.target.value)} />
            </Field>
            <Button variant="danger" isLoading={bulkBusy} onClick={handleBulkDelete}>
              Delete Matching
            </Button>
          </div>
        </Card>
      )}

      {editingCell && (
        <AssignmentEditorModal
          open
          employeeName={employees.find((e) => e.id === editingCell.employeeId)?.name ?? "Employee"}
          date={editingCell.date}
          dutySchedules={dutySchedules}
          currentDutyScheduleId={editingCell.assignment?.dutyScheduleId ?? null}
          busy={editBusy}
          onClose={() => setEditingCell(null)}
          onSave={handleSaveAssignment}
        />
      )}
    </div>
  );
}
