import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { DepartmentDto, EmployeeDto } from "@hrm-plus/shared";
import { Avatar, Button, Card, Field, Input, Select, Spinner, StatusPill } from "@hrm-plus/ui";
import { getEmployee, updateEmployee } from "../../api/employees";
import { listDepartments } from "../../api/departments";

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<EmployeeDto | null>(null);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ jobTitle: "", departmentId: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getEmployee(Number(id)).then((e) => {
      setEmployee(e);
      setForm({ jobTitle: e.jobTitle ?? "", departmentId: e.departmentId ? String(e.departmentId) : "" });
    });
    listDepartments().then(setDepartments).catch(() => setDepartments([]));
  }, [id]);

  if (!employee) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateEmployee(employee!.id, {
        jobTitle: form.jobTitle || null,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
      });
      setEmployee(updated);
      setEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to update employee");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus() {
    setSaving(true);
    try {
      const updated = await updateEmployee(employee!.id, {
        status: employee!.status === "Active" ? "Inactive" : "Active",
      });
      setEmployee(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <Card>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar name={`${employee.firstName} ${employee.lastName}`} size="lg" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  {employee.firstName} {employee.lastName}
                </h1>
                <p className="text-sm text-slate-500">
                  {employee.employeeCode} · {employee.email}
                </p>
              </div>
            </div>
            <StatusPill status={employee.status} />
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {!editing ? (
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-slate-500">Job title</dt>
              <dd className="text-slate-900">{employee.jobTitle ?? "—"}</dd>
              <dt className="text-slate-500">Department</dt>
              <dd className="text-slate-900">{employee.departmentName ?? "—"}</dd>
              <dt className="text-slate-500">Manager</dt>
              <dd className="text-slate-900">{employee.managerName ?? "—"}</dd>
              <dt className="text-slate-500">Role</dt>
              <dd className="text-slate-900">{employee.role ?? "—"}</dd>
              <dt className="text-slate-500">Start date</dt>
              <dd className="text-slate-900">{employee.startDate.slice(0, 10)}</dd>
            </dl>
          ) : (
            <div className="space-y-3">
              <Field label="Job title">
                <Input
                  value={form.jobTitle}
                  onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                />
              </Field>
              <Field label="Department">
                <Select
                  value={form.departmentId}
                  onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
                >
                  <option value="">None</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {editing ? (
              <>
                <Button onClick={handleSave} isLoading={saving}>
                  Save
                </Button>
                <Button variant="secondary" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setEditing(true)}>Edit</Button>
                <Button variant="secondary" onClick={handleToggleStatus} isLoading={saving}>
                  {employee.status === "Active" ? "Deactivate" : "Reactivate"}
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
