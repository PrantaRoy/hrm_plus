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
import { DutyScheduleAssignmentDto, RosterDto } from "@hrm-plus/shared";
import { Button, Card, PageHeader, Spinner, StatusPill } from "@hrm-plus/ui";
import { autoGenerateRoster, approveRoster, getRoster, listAssignments, updateAssignment } from "../../api/rosters";
import { listEmployees } from "../../api/employees";
import { CalendarEmployee, CalendarGrid } from "./components/CalendarGrid";

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
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor)
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rosterDto = await getRoster(rosterId);
      setRoster(rosterDto);

      const [employeeRes, assignmentList] = await Promise.all([
        listEmployees({ page: 1, pageSize: 100, departmentId: rosterDto.departmentId }),
        listAssignments(rosterId, {}),
      ]);

      setEmployees(
        employeeRes.items
          .filter((e) => e.status === "Active")
          .map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, code: e.employeeCode }))
      );
      setAssignments(assignmentList);
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
          This roster is {roster.status.toLowerCase()} and is read-only.
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
              readOnly={!isDraft}
            />
          </DndContext>
        )}
      </Card>
    </div>
  );
}
