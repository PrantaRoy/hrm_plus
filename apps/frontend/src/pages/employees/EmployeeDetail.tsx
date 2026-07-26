import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DepartmentDto, EmployeeDto } from "@hrm-plus/shared";
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
    return <p className="text-slate-400">Loading...</p>;
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
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500">
        ← Back
      </button>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="text-sm text-slate-500">
              {employee.employeeCode} · {employee.email}
            </p>
          </div>
          <span
            className={
              employee.status === "Active"
                ? "text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs h-fit"
                : "text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-xs h-fit"
            }
          >
            {employee.status}
          </span>
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}

        {!editing ? (
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
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
            <label className="block text-sm">
              <span className="text-slate-700 font-medium">Job title</span>
              <input
                value={form.jobTitle}
                onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-700 font-medium">Department</span>
              <select
                value={form.departmentId}
                onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
                className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
              >
                <option value="">None</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-slate-900 text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="border border-slate-300 rounded px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="bg-slate-900 text-white rounded px-4 py-2 text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={saving}
                className="border border-slate-300 rounded px-4 py-2 text-sm disabled:opacity-50"
              >
                {employee.status === "Active" ? "Deactivate" : "Reactivate"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
