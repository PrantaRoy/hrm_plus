import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DepartmentDto, RoleDto, RoleName } from "@hrm-plus/shared";
import { Button, Card, Field, Input, PageHeader, Select } from "@hrm-plus/ui";
import { createEmployee } from "../../api/employees";
import { listDepartments } from "../../api/departments";
import { listRoles } from "../../api/roles";

export default function EmployeeCreate() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jobTitle: "",
    startDate: new Date().toISOString().slice(0, 10),
    departmentId: "",
    role: "" as RoleName,
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listDepartments().then(setDepartments).catch(() => setDepartments([]));
    listRoles()
      .then((allRoles) => {
        const activeRoles = allRoles.filter((r) => r.status === "Active");
        setRoles(activeRoles);
        setForm((f) => (f.role ? f : { ...f, role: activeRoles[0]?.name ?? "" }));
      })
      .catch(() => setRoles([]));
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
    <div className="max-w-xl space-y-5">
      <PageHeader title="New Employee" description="Add a new person to your organisation." />
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="First name" required>
              <Input required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </Field>
            <Field label="Last name" required>
              <Input required value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </Field>
          </div>
          <Field label="Email" required>
            <Input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Job title">
            <Input value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start date" required>
              <Input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </Field>
            <Field label="Department">
              <Select value={form.departmentId} onChange={(e) => set("departmentId", e.target.value)}>
                <option value="">None</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Role" required>
            <Select value={form.role} onChange={(e) => set("role", e.target.value as RoleName)}>
              {roles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Temporary password" required>
            <Input
              type="password"
              required
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
          </Field>

          <Button type="submit" isLoading={submitting} className="w-full">
            Create Employee
          </Button>
        </form>
      </Card>
    </div>
  );
}
