import { FormEvent, useEffect, useState } from "react";
import {
  CONTRACT_TYPES,
  ClientDto,
  CreateProjectInput,
  DEADLINE_TYPES,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  ProjectDto,
} from "@hrm-plus/shared";
import { Button, Field, Input, Modal, Select, Textarea } from "@hrm-plus/ui";
import { listClients } from "../../api/clients";
import { createProject, updateProject } from "../../api/projects";
import { apiErrorMessage } from "../../utils/apiError";
import { EmployeeMultiSelect } from "./EmployeeMultiSelect";
import { humanize } from "./format";
import { useEmployeeOptions } from "./useEmployeeOptions";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pass a project to edit it; omit to create. */
  project?: ProjectDto;
  onSaved: (project: ProjectDto) => void;
}

interface FormState {
  title: string;
  code: string;
  contractType: string;
  clientId: string;
  status: string;
  totalAmount: string;
  estimatedHours: string;
  deadlineType: string;
  startDate: string;
  targetEndDate: string;
  supervisorId: string;
  priority: string;
  description: string;
  tags: string;
  memberIds: number[];
}

function initialState(project?: ProjectDto): FormState {
  return {
    title: project?.title ?? "",
    code: "",
    contractType: project?.contractType ?? "fixed",
    clientId: project?.clientId ? String(project.clientId) : "",
    status: project?.status ?? "not_started",
    totalAmount: project ? String(project.totalAmount) : "0",
    estimatedHours: project ? String(project.estimatedHours) : "0",
    deadlineType: project?.deadlineType ?? "casual",
    startDate: project?.startDate ?? new Date().toISOString().slice(0, 10),
    targetEndDate: project?.targetEndDate ?? "",
    supervisorId: project ? String(project.supervisor.id) : "",
    priority: project?.priority ?? "medium",
    description: project?.description ?? "",
    tags: project?.tags.join(", ") ?? "",
    memberIds: project?.members.map((m) => m.id) ?? [],
  };
}

export function ProjectFormModal({ open, onClose, project, onSaved }: Props) {
  const isEdit = Boolean(project);
  const [form, setForm] = useState<FormState>(() => initialState(project));
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { options: employees, failed: employeesFailed } = useEmployeeOptions();

  useEffect(() => {
    if (!open) return;
    setForm(initialState(project));
    setError(null);
    listClients({ pageSize: 100, isActive: true })
      .then((res) => setClients(res.items))
      .catch(() => setClients([]));
  }, [open, project]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.supervisorId) {
      setError("Select a supervisor");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      title: form.title.trim(),
      contractType: form.contractType as CreateProjectInput["contractType"],
      clientId: form.clientId ? Number(form.clientId) : null,
      status: form.status as CreateProjectInput["status"],
      totalAmount: Number(form.totalAmount || 0),
      estimatedHours: Number(form.estimatedHours || 0),
      deadlineType: form.deadlineType as CreateProjectInput["deadlineType"],
      startDate: form.startDate,
      targetEndDate: form.targetEndDate || null,
      supervisorId: Number(form.supervisorId),
      priority: form.priority as CreateProjectInput["priority"],
      description: form.description.trim(),
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      memberIds: form.memberIds,
    };
    try {
      const saved = project
        ? await updateProject(project.id, payload)
        : await createProject({ ...payload, ...(form.code.trim() ? { code: form.code.trim().toLowerCase() } : {}) });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to save project"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? "Edit project" : "New project"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="project-form" isLoading={saving}>
            {isEdit ? "Save changes" : "Create project"}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={submit} className="space-y-4">
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}
        <div className="grid grid-cols-3 gap-3">
          <Field label="Title" required className="col-span-2">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} required maxLength={191} />
          </Field>
          <Field label="Code" helperText={isEdit ? "Task-number prefix (fixed)" : "Task prefix, e.g. hrm → hrm-101"}>
            <Input
              value={isEdit ? project?.code : form.code}
              onChange={(e) => set("code", e.target.value)}
              disabled={isEdit}
              placeholder="auto"
              maxLength={10}
            />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Client" helperText="Empty = internal project">
            <Select value={form.clientId} onChange={(e) => set("clientId", e.target.value)}>
              <option value="">Internal</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Contract type" required>
            <Select value={form.contractType} onChange={(e) => set("contractType", e.target.value)}>
              {CONTRACT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {humanize(t)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {humanize(s)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Total amount" required>
            <Input type="number" min={0} step="0.01" value={form.totalAmount} onChange={(e) => set("totalAmount", e.target.value)} required />
          </Field>
          <Field label="Estimated hours" required>
            <Input type="number" min={0} step="0.01" value={form.estimatedHours} onChange={(e) => set("estimatedHours", e.target.value)} required />
          </Field>
          <Field label="Priority" required>
            <Select value={form.priority} onChange={(e) => set("priority", e.target.value)}>
              {PROJECT_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {humanize(p)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Deadline type" required>
            <Select value={form.deadlineType} onChange={(e) => set("deadlineType", e.target.value)}>
              {DEADLINE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {humanize(t)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Start date" required>
            <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} required />
          </Field>
          <Field label="Target end date" required={form.deadlineType === "fixed"}>
            <Input
              type="date"
              value={form.targetEndDate}
              onChange={(e) => set("targetEndDate", e.target.value)}
              required={form.deadlineType === "fixed"}
            />
          </Field>
        </div>
        <Field
          label="Supervisor"
          required
          error={employeesFailed ? "Could not load employees" : undefined}
        >
          <Select value={form.supervisorId} onChange={(e) => set("supervisorId", e.target.value)} required>
            <option value="">Select…</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Members">
          <EmployeeMultiSelect options={employees} value={form.memberIds} onChange={(ids) => set("memberIds", ids)} />
        </Field>
        <Field label="Tags" helperText="Comma separated">
          <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} />
        </Field>
        <Field label="Description">
          <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
