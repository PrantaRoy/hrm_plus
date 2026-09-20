import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Play, Square } from "lucide-react";
import { ChecklistDto, TASK_STATUSES, TaskDto, TimeEntryListDto } from "@hrm-plus/shared";
import { Badge, Button, Card, Checkbox, Field, Input, PageHeader, Select, Spinner } from "@hrm-plus/ui";
import {
  addChecklistItem,
  createTimeEntry,
  deleteChecklistItem,
  deleteTask,
  deleteTimeEntry,
  getTask,
  listTimeEntries,
  setChecklistCompleted,
  setChecklistVerified,
  startTimer,
  stopTimer,
  updateTask,
} from "../../api/tasks";
import { apiErrorMessage } from "../../utils/apiError";
import { AttachmentsPanel } from "../../components/projects/AttachmentsPanel";
import { CommentsPanel } from "../../components/projects/CommentsPanel";
import { TaskFormModal } from "../../components/projects/TaskFormModal";
import { PriorityBadge, ProgressBar, TaskStatusBadge } from "../../components/projects/labels";
import { formatDateTime, formatMinutes, humanize, localInputToIso } from "../../components/projects/format";

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{children}</dd>
    </div>
  );
}

function recurrenceSummary(task: TaskDto): string {
  if (task.recurrenceParentId != null) return "Generated from a recurring task";
  if (task.recurrenceFrequency === "none") return "Does not repeat";
  const every =
    task.recurrenceFrequency === "custom"
      ? `every ${task.recurrenceIntervalDays} days`
      : humanize(task.recurrenceFrequency).toLowerCase();
  const left = task.totalCycles > 0 ? `${task.totalCycles} cycle(s) left` : "no cycles left";
  return `Repeats ${every} · ${left}`;
}

export default function TaskDetail() {
  const { id } = useParams();
  const taskId = Number(id);
  const navigate = useNavigate();

  const [task, setTask] = useState<TaskDto | null>(null);
  const [time, setTime] = useState<TimeEntryListDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [timerBusy, setTimerBusy] = useState(false);
  const [manual, setManual] = useState({ start: "", end: "", note: "", billable: true });

  const loadTime = useCallback(() => {
    listTimeEntries(taskId)
      .then(setTime)
      .catch((err) => setError(apiErrorMessage(err, "Failed to load time entries")));
  }, [taskId]);

  useEffect(() => {
    setLoading(true);
    getTask(taskId)
      .then(setTask)
      .catch((err) => setError(apiErrorMessage(err, "Failed to load task")))
      .finally(() => setLoading(false));
    loadTime();
  }, [taskId, loadTime]);

  function patchChecklist(updated: ChecklistDto) {
    setTask((t) => (t ? { ...t, checklists: t.checklists.map((c) => (c.id === updated.id ? updated : c)) } : t));
  }

  async function run<T>(action: () => Promise<T>, failure: string): Promise<T | undefined> {
    setError(null);
    try {
      return await action();
    } catch (err) {
      setError(apiErrorMessage(err, failure));
      return undefined;
    }
  }

  async function changeStatus(status: string) {
    const updated = await run(() => updateTask(taskId, { status: status as TaskDto["status"] }), "Failed to update status");
    if (updated) setTask(updated);
  }

  async function changeProgress(value: string) {
    const next = Math.max(0, Math.min(100, Number(value)));
    if (Number.isNaN(next) || next === task?.progressPercentage) return;
    const updated = await run(() => updateTask(taskId, { progressPercentage: next }), "Failed to update progress");
    if (updated) setTask(updated);
  }

  async function toggleCompleted(item: ChecklistDto) {
    const updated = await run(() => setChecklistCompleted(taskId, item.id, !item.isCompleted), "Failed to update item");
    if (updated) patchChecklist(updated);
  }

  async function toggleVerified(item: ChecklistDto) {
    const updated = await run(() => setChecklistVerified(taskId, item.id, !item.isVerified), "Failed to verify item");
    if (updated) patchChecklist(updated);
  }

  async function removeItem(item: ChecklistDto) {
    const done = await run(() => deleteChecklistItem(taskId, item.id).then(() => true), "Failed to delete item");
    if (done) setTask((t) => (t ? { ...t, checklists: t.checklists.filter((c) => c.id !== item.id) } : t));
  }

  async function addItem(e: FormEvent) {
    e.preventDefault();
    if (!newItem.trim()) return;
    const created = await run(() => addChecklistItem(taskId, newItem.trim()), "Failed to add item");
    if (created) {
      setTask((t) => (t ? { ...t, checklists: [...t.checklists, created] } : t));
      setNewItem("");
    }
  }

  async function toggleTimer(running: boolean) {
    setTimerBusy(true);
    await run(() => (running ? stopTimer(taskId) : startTimer(taskId)), running ? "Failed to stop timer" : "Failed to start timer");
    loadTime();
    setTimerBusy(false);
  }

  async function addManualEntry(e: FormEvent) {
    e.preventDefault();
    const startTime = localInputToIso(manual.start);
    const endTime = localInputToIso(manual.end);
    if (!startTime || !endTime) return;
    const created = await run(
      () => createTimeEntry(taskId, { startTime, endTime, note: manual.note.trim() || null, isBillable: manual.billable }),
      "Failed to log time"
    );
    if (created) {
      setManual({ start: "", end: "", note: "", billable: true });
      loadTime();
    }
  }

  async function removeEntry(entryId: number) {
    if (!window.confirm("Delete this time entry?")) return;
    const done = await run(() => deleteTimeEntry(entryId).then(() => true), "Failed to delete time entry");
    if (done) loadTime();
  }

  async function removeTask() {
    if (!task || !window.confirm(`Delete ${task.taskNumber}?`)) return;
    const done = await run(() => deleteTask(taskId).then(() => true), "Failed to delete task");
    if (done) navigate(`/projects/${task.projectId}`);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }
  if (!task) {
    return (
      <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
        {error ?? "Task not found"}
      </div>
    );
  }

  const viewer = task.viewer ?? { canManage: false, canWork: false };
  const runningEntries = time?.items.filter((e) => e.isRunning) ?? [];
  const verifiedCount = task.checklists.filter((c) => c.isVerified).length;
  const completedCount = task.checklists.filter((c) => c.isCompleted).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {task.title}
            <TaskStatusBadge status={task.status} />
          </span>
        }
        description={
          <span>
            <Link to={`/projects/${task.projectId}`} className="hover:underline">
              {task.projectTitle}
            </Link>{" "}
            / {task.taskNumber}
          </span>
        }
        actions={
          viewer.canManage ? (
            <>
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button variant="danger" onClick={removeTask}>
                Delete
              </Button>
            </>
          ) : undefined
        }
      />

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}

      <Card title="Details">
        <dl className="grid grid-cols-4 gap-x-6 gap-y-4">
          <Detail label="Priority">
            <PriorityBadge priority={task.priority} />
          </Detail>
          <Detail label="Supervisor">{task.supervisor.name}</Detail>
          <Detail label="Due">{formatDateTime(task.dueDate)}</Detail>
          <Detail label="Time type">{humanize(task.timeType)}</Detail>
          <Detail label="Budget">
            {task.budgetAmount != null
              ? task.budgetAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })
              : "—"}
          </Detail>
          <Detail label="Members">
            {task.members.length === 0 ? "—" : task.members.map((m) => m.name).join(", ")}
          </Detail>
          <Detail label="Followers">
            {task.followers.length === 0 ? "—" : task.followers.map((m) => m.name).join(", ")}
          </Detail>
          <Detail label="Recurrence">{recurrenceSummary(task)}</Detail>
        </dl>

        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 items-end">
          <Field label="Status">
            <Select value={task.status} disabled={!viewer.canWork} onChange={(e) => changeStatus(e.target.value)}>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {humanize(s)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Progress %">
            {viewer.canWork ? (
              <Input
                key={task.progressPercentage}
                type="number"
                min={0}
                max={100}
                defaultValue={task.progressPercentage}
                onBlur={(e) => changeProgress(e.target.value)}
              />
            ) : (
              <ProgressBar value={task.progressPercentage} />
            )}
          </Field>
          {viewer.canWork && <ProgressBar value={task.progressPercentage} />}
        </div>

        {task.description && (
          <p className="mt-5 pt-4 border-t border-slate-100 text-sm text-slate-700 whitespace-pre-wrap">
            {task.description}
          </p>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-5 items-start">
        <Card
          title="Checklist"
          description={
            task.checklists.length
              ? `${completedCount}/${task.checklists.length} done · ${verifiedCount} verified`
              : undefined
          }
        >
          {task.checklists.length === 0 && <p className="text-sm text-slate-400 mb-3">No checklist items.</p>}
          <ul className="divide-y divide-slate-100">
            {task.checklists.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-2 text-sm">
                <Checkbox
                  checked={item.isCompleted}
                  disabled={!viewer.canWork}
                  onChange={() => toggleCompleted(item)}
                  aria-label={`Mark "${item.title}" done`}
                />
                <span className={item.isCompleted ? "text-slate-400 line-through" : "text-slate-800"}>{item.title}</span>
                <span className="ml-auto flex items-center gap-3">
                  {item.isVerified && <Badge color="green">Verified</Badge>}
                  {viewer.canManage && item.isCompleted && (
                    <button onClick={() => toggleVerified(item)} className="text-xs text-brand-700 hover:underline">
                      {item.isVerified ? "Unverify" : "Verify"}
                    </button>
                  )}
                  {viewer.canManage && (
                    <button onClick={() => removeItem(item)} className="text-xs text-red-600 hover:underline">
                      Delete
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {viewer.canManage && (
            <form onSubmit={addItem} className="flex gap-2 mt-3">
              <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Add checklist item…" maxLength={191} />
              <Button type="submit" size="sm" variant="secondary" disabled={!newItem.trim()}>
                Add
              </Button>
            </form>
          )}
        </Card>

        <Card
          title="Time tracking"
          description={
            time ? `${formatMinutes(time.totalMinutes)} logged · ${formatMinutes(time.billableMinutes)} billable` : undefined
          }
          actions={
            viewer.canWork ? (
              runningEntries.length > 0 ? (
                <Button size="sm" variant="danger" isLoading={timerBusy} onClick={() => toggleTimer(true)}>
                  <Square className="h-3.5 w-3.5" />
                  Stop timer
                </Button>
              ) : (
                <Button size="sm" isLoading={timerBusy} onClick={() => toggleTimer(false)}>
                  <Play className="h-3.5 w-3.5" />
                  Start timer
                </Button>
              )
            ) : undefined
          }
        >
          {viewer.canWork && (
            <form onSubmit={addManualEntry} className="grid grid-cols-2 gap-2 mb-4 pb-4 border-b border-slate-100">
              <Field label="From">
                <Input type="datetime-local" value={manual.start} onChange={(e) => setManual({ ...manual, start: e.target.value })} required />
              </Field>
              <Field label="To">
                <Input type="datetime-local" value={manual.end} onChange={(e) => setManual({ ...manual, end: e.target.value })} required />
              </Field>
              <Field label="Note" className="col-span-2">
                <Input value={manual.note} onChange={(e) => setManual({ ...manual, note: e.target.value })} />
              </Field>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <Checkbox checked={manual.billable} onChange={(e) => setManual({ ...manual, billable: e.target.checked })} />
                Billable
              </label>
              <div className="text-right">
                <Button type="submit" size="sm" variant="secondary">
                  Log time
                </Button>
              </div>
            </form>
          )}
          {!time ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : time.items.length === 0 ? (
            <p className="text-sm text-slate-400">No time logged yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {time.items.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2 text-sm">
                  <div>
                    <div className="text-slate-800">
                      {e.employee.name}
                      {e.isRunning && <Badge color="brand" className="ml-2">Running</Badge>}
                      {!e.isBillable && <Badge className="ml-2">Non-billable</Badge>}
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatDateTime(e.startTime)} → {e.isRunning ? "now" : formatDateTime(e.endTime)}
                      {e.note ? ` · ${e.note}` : ""}
                    </div>
                  </div>
                  <span className="ml-auto text-slate-700 tabular-nums">{formatMinutes(e.durationMinutes)}</span>
                  {viewer.canWork && (
                    <button onClick={() => removeEntry(e.id)} className="text-xs text-red-600 hover:underline">
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-5 items-start">
        <CommentsPanel kind="task" ownerId={task.id} canModerate={viewer.canManage} />
        <AttachmentsPanel kind="task" ownerId={task.id} canModerate={viewer.canManage} />
      </div>

      <TaskFormModal open={editing} onClose={() => setEditing(false)} task={task} onSaved={setTask} />
    </div>
  );
}
