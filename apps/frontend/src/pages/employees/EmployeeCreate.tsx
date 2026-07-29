import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DepartmentDto,
  DesignationDto,
  EMPLOYMENT_TYPES,
  EmployeeDto,
  EmploymentType,
  GENDERS,
  Gender,
  RoleDto,
  RoleName,
} from "@hrm-plus/shared";
import { Button, Card, Field, Input, PageHeader, Select } from "@hrm-plus/ui";
import { createEmployee, listEmployees } from "../../api/employees";
import { listDepartments } from "../../api/departments";
import { listDesignations } from "../../api/designations";
import { listRoles } from "../../api/roles";

export default function EmployeeCreate() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [designations, setDesignations] = useState<DesignationDto[]>([]);
  const [managers, setManagers] = useState<EmployeeDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    gender: "" as Gender | "",
    dateOfBirth: "",
    jobTitle: "",
    joiningDate: new Date().toISOString().slice(0, 10),
    employmentType: "Full-Time" as EmploymentType,
    departmentId: "",
    designationId: "",
    reportingToId: "",
    role: "" as RoleName,
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listDepartments().then(setDepartments).catch(() => setDepartments([]));
    listDesignations().then(setDesignations).catch(() => setDesignations([]));
    listEmployees({ page: 1, pageSize: 100 })
      .then((res) => setManagers(res.items))
      .catch(() => setManagers([]));
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
        phoneNumber: form.phoneNumber || undefined,
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        jobTitle: form.jobTitle || undefined,
        joiningDate: form.joiningDate,
        employmentType: form.employmentType,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        designationId: form.designationId ? Number(form.designationId) : null,
        reportingToId: form.reportingToId ? Number(form.reportingToId) : null,
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
    <div className="max-w-2xl space-y-5">
      <PageHeader title="New Employee" description="Add a new person to your organisation." />
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <Card title="Personal information">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First name" required>
                <Input required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
              </Field>
              <Field label="Last name" required>
                <Input required value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email" required>
                <Input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
              </Field>
              <Field label="Phone number">
                <Input value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Gender">
                <Select value={form.gender} onChange={(e) => set("gender", e.target.value as Gender)}>
                  <option value="">Not specified</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Date of birth">
                <Input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => set("dateOfBirth", e.target.value)}
                />
              </Field>
            </div>
          </div>
        </Card>

        <Card title="Employment details">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Joining date" required>
                <Input
                  type="date"
                  required
                  value={form.joiningDate}
                  onChange={(e) => set("joiningDate", e.target.value)}
                />
              </Field>
              <Field label="Employment type">
                <Select
                  value={form.employmentType}
                  onChange={(e) => set("employmentType", e.target.value as EmploymentType)}
                >
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <Field label="Designation">
                <Select value={form.designationId} onChange={(e) => set("designationId", e.target.value)}>
                  <option value="">None</option>
                  {designations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Job title">
                <Input value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
              </Field>
              <Field label="Reporting to">
                <Select value={form.reportingToId} onChange={(e) => set("reportingToId", e.target.value)}>
                  <option value="">None</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>
        </Card>

        <Card title="Account access">
          <div className="space-y-4">
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
          </div>
        </Card>

        <Button type="submit" isLoading={submitting} className="w-full">
          Create Employee
        </Button>
      </form>
    </div>
  );
}
