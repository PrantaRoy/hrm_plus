import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DepartmentDto, ROLES, RoleName } from "@hrm-plus/shared";
import { createEmployee } from "../../api/employees";
import { listDepartments } from "../../api/departments";

export default function EmployeeCreate() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jobTitle: "",
    startDate: new Date().toISOString().slice(0, 10),
    departmentId: "",
    role: "Staff" as RoleName,
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listDepartments().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const employee = await createEmployee({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        jobTitle: form.jobTitle || undefined,
        startDate: form.startDate,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        role: form.role,
        password: form.password,
      });
      navigate(`/employees/${employee.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to create employee");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-slate-900 mb-4">New Employee</h1>
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <TextField label="First name" value={form.firstName} onChange={(v) => set("firstName", v)} />
          <TextField label="Last name" value={form.lastName} onChange={(v) => set("lastName", v)} />
        </div>
        <TextField label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} />
        <TextField label="Job title" value={form.jobTitle} onChange={(v) => set("jobTitle", v)} required={false} />
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Start date"
            type="date"
            value={form.startDate}
            onChange={(v) => set("startDate", v)}
          />
          <label className="block text-sm">
            <span className="text-slate-700 font-medium">Department</span>
            <select
              value={form.departmentId}
              onChange={(e) => set("departmentId", e.target.value)}
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
        <label className="block text-sm">
          <span className="text-slate-700 font-medium">Role</span>
          <select
            value={form.role}
            onChange={(e) => set("role", e.target.value as RoleName)}
            className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <TextField
          label="Temporary password"
          type="password"
          value={form.password}
          onChange={(v) => set("password", v)}
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-slate-900 text-white rounded py-2 font-medium disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Employee"}
        </button>
      </form>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-700 font-medium">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
      />
    </label>
  );
}
