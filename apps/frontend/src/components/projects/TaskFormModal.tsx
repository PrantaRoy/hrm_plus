import { FormEvent, useEffect, useState } from "react";
import {
  CreateTaskInput,
  RECURRENCE_FREQUENCIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TIME_TYPES,
  TaskDto,
} from "@hrm-plus/shared";
import { Button, Field, Input, Modal, Select, Textarea } from "@hrm-plus/ui";
import { createTask, updateTask } from "../../api/tasks";
import { apiErrorMessage } from "../../utils/apiError";
import { EmployeeMultiSelect } from "./EmployeeMultiSelect";
import { humanize, isoToLocalInput, localInputToIso } from "./format";
import { useEmployeeOptions } from "./useEmployeeOptions";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Create mode: the project the task is added to. */
  projectId?: number;
  /** Create mode: preselected supervisor (the project supervisor). */
  defaultSupervisorId?: number;
  /** Edit mode: the task being edited. */
  task?: TaskDto;
  onSaved: (task: TaskDto) => void;
}

interface FormState {
  title: string;
  priority: string;
  status: string;
  timeType: string;
  dueDate: string;
  budgetAmount: string;
  supervisorId: string;
  recurrenceFrequency: string;
  recurrenceIntervalDays: string;
  totalCycles: string;
  progressPercentage: string;
  description: string;
  memberIds: number[];
  followerIds: number[];
  checklist: string;
}

function initialState(task: TaskDto | undefined, defaultSupervisorId: number | undefined): FormState {
  return {
    title: task?.title ?? "",
    priority: task?.priority ?? "medium",
    status: task?.status ?? "to_do",
    timeType: task?.timeType ?? "flexible",
    dueDate: isoToLocalInput(task?.dueDate),
    budgetAmount: task?.budgetAmount != null ? String(task.budgetAmount) : "",
    supervisorId: task ? String(task.supervisor.id) : defaultSupervisorId ? String(defaultSupervisorId) : "",
    recurrenceFrequency: task?.recurrenceFrequency ?? "none",
    recurrenceIntervalDays: task?.recurrenceIntervalDays ? String(task.recurrenceIntervalDays) : "",
    totalCycles: task ? String(task.totalCycles) : "0",
    progressPercentage: task ? String(task.progressPercentage) : "0",
    description: task?.description ?? "",
    memberIds: task?.members.map((m) => m.id) ?? [],
    followerIds: task?.followers.map((f) => f.id) ?? [],
    checklist: "",
  };
}

export function TaskFormModal({ open, onClose, projectId, defaultSupervisorId, task, onSaved }: Props) {
  const isEdit = Boolean(task);
  const [form, setForm] = useState<FormState>(() => initialState(task, defaultSupervisorId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { options: employees, failed: employeesFailed } = useEmployeeOptions();

  useEffect(() => {
    if (!open) return;
    setForm(initialState(task, defaultSupervisorId));
    setError(null);
  }, [open, task, defaultSupervisorId]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const recurring = form.recurrenceFrequency !== "none";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      title: form.title.trim(),
      priority: form.priority as CreateTaskInput["priority"],
      status: form.status as CreateTaskInput["status"],
      timeType: form.timeType as CreateTaskInput["timeType"],
      dueDate: localInputToIso(form.dueDate),
      budgetAmount: form.budgetAmount ? Number(form.budgetAmount) : null,
      supervisorId: form.supervisorId ? Number(form.supervisorId) : undefined,
      recurrenceFrequency: form.recurrenceFrequency as CreateTaskInput["recurrenceFrequency"],
      recurrenceIntervalDays:
        form.recurrenceFrequency === "custom" && form.recurrenceIntervalDays
          ? Number(form.recurrenceIntervalDays)
          : null,
      totalCycles: recurring ? Number(form.totalCycles || 0) : 0,
      description: form.description.trim(),
      memberIds: form.memberIds,
      followerIds: form.followerIds,
    };
    try {
      const saved = task
        ? await updateTask(task.id, { ...payload, progressPercentage: Number(form.progressPercentage || 0) })
        : await createTask({
            ...payload,
            projectId: projectId!,
            checklist: form.checklist
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean),
          });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to save task"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? `Edit ${task?.taskNumber}` : "New task"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="task-form" isLoading={saving}>
            {isEdit ? "Save changes" : "Create task"}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit} className="space-y-4">
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}
        <Field label="Title" required>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} required maxLength={191} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Priority" required>
            <Select value={form.priority} onChange={(e) => set("priority", e.target.value)}>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {humanize(p)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {humanize(s)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Time type" required>
            <Select value={form.timeType} onChange={(e) => set("timeType", e.target.value)}>
              {TASK_TIME_TYPES.map((t) => (
                <option key={t} value={t}>
                  {humanize(t)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Due date">
            <Input type="datetime-local" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
          </Field>
          <Field label="Budget">
            <Input type="number" min={0} step="0.01" value={form.budgetAmount} onChange={(e) => set("budgetAmount", e.target.value)} />
          </Field>
          {isEdit && (
            <Field label="Progress %">
              <Input type="number" min={0} max={100} value={form.progressPercentage} onChange={(e) => set("progressPercentage", e.target.value)} />
            </Field>
          )}
        </div>
        <Field label="Supervisor" helperText="Defaults to the project supervisor" error={employeesFailed ? "Could not load employees" : undefined}>
          <Select value={form.supervisorId} onChange={(e) => set("supervisorId", e.target.value)}>
            <option value="">Project supervisor</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Members">
            <EmployeeMultiSelect options={employees} value={form.memberIds} onChange={(ids) => set("memberIds", ids)} />
          </Field>
          <Field label="Followers">
            <EmployeeMultiSelect options={employees} value={form.followerIds} onChange={(ids) => set("followerIds", ids)} />
          </Field>
        </div>

        <div className="rounded-md border border-slate-200 p-3 space-y-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Recurrence</p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Repeats">
              <Select value={form.recurrenceFrequency} onChange={(e) => set("recurrenceFrequency", e.target.value)}>
                {RECURRENCE_FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {humanize(f)}
                  </option>
                ))}
              </Select>
            </Field>
            {form.recurrenceFrequency === "custom" && (
              <Field label="Every (days)" required>
                <Input type="number" min={1} value={form.recurrenceIntervalDays} onChange={(e) => set("recurrenceIntervalDays", e.target.value)} required />
              </Field>
            )}
            {recurring && (
              <Field label="Cycles to generate" helperText="Copies still to be created">
                <Input type="number" min={0} max={1000} value={form.totalCycles} onChange={(e) => set("totalCycles", e.target.value)} />
              </Field>
            )}
          </div>
        </div>

        {!isEdit && (
          <Field label="Checklist" helperText="One item per line">
            <Textarea rows={3} value={form.checklist} onChange={(e) => set("checklist", e.target.value)} />
          </Field>
        )}
        <Field label="Description">
          <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
