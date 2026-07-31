import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Camera } from "lucide-react";
import {
  DepartmentDto,
  DesignationDto,
  EMPLOYMENT_TYPES,
  EmployeeDto,
  EmploymentType,
  GENDERS,
  Gender,
} from "@hrm-plus/shared";
import { Avatar, Button, Card, Field, Input, Select, Spinner, StatusPill } from "@hrm-plus/ui";
import { getEmployee, listEmployees, updateEmployee, uploadEmployeeAvatar } from "../../api/employees";
import { listDepartments } from "../../api/departments";
import { listDesignations } from "../../api/designations";
import { resolveFileUrl } from "../../utils/fileUrl";
import { EmployeeDocumentsPanel } from "./EmployeeDocumentsPanel";
import { EmployeeLeaveAllocationsPanel } from "./EmployeeLeaveAllocationsPanel";
import { DutyScheduleMonthCalendar } from "../../components/DutyScheduleMonthCalendar";

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [employee, setEmployee] = useState<EmployeeDto | null>(null);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [designations, setDesignations] = useState<DesignationDto[]>([]);
  const [managers, setManagers] = useState<EmployeeDto[]>([]);
  const [editing, setEditing] = useState(() => searchParams.get("edit") === "true");
  const [form, setForm] = useState({
    phoneNumber: "",
    gender: "" as Gender | "",
    dateOfBirth: "",
    jobTitle: "",
    terminationDate: "",
    employmentType: "Full-Time" as EmploymentType,
    departmentId: "",
    designationId: "",
    reportingToId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    getEmployee(Number(id)).then((e) => {
      setEmployee(e);
      setForm({
        phoneNumber: e.phoneNumber ?? "",
        gender: e.gender ?? "",
        dateOfBirth: e.dateOfBirth ? e.dateOfBirth.slice(0, 10) : "",
        jobTitle: e.jobTitle ?? "",
        terminationDate: e.terminationDate ? e.terminationDate.slice(0, 10) : "",
        employmentType: e.employmentType,
        departmentId: e.departmentId ? String(e.departmentId) : "",
        designationId: e.designationId ? String(e.designationId) : "",
        reportingToId: e.reportingToId ? String(e.reportingToId) : "",
      });
    });
    listDepartments().then(setDepartments).catch(() => setDepartments([]));
    listDesignations().then(setDesignations).catch(() => setDesignations([]));
    listEmployees({ page: 1, pageSize: 100 })
      .then((res) => setManagers(res.items.filter((m) => m.id !== Number(id))))
      .catch(() => setManagers([]));
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
        phoneNumber: form.phoneNumber || null,
        gender: form.gender || null,
        dateOfBirth: form.dateOfBirth || null,
        jobTitle: form.jobTitle || null,
        terminationDate: form.terminationDate || null,
        employmentType: form.employmentType,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        designationId: form.designationId ? Number(form.designationId) : null,
        reportingToId: form.reportingToId ? Number(form.reportingToId) : null,
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

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setError(null);
    try {
      const updated = await uploadEmployeeAvatar(employee!.id, file);
      setEmployee(updated);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to upload photo");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  }

  return (
    <div className="max-w-6xl space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar
                  name={`${employee.firstName} ${employee.lastName}`}
                  src={resolveFileUrl(employee.avatarUrl)}
                  size="lg"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  title="Change photo"
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-700 disabled:opacity-50"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
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
              <dt className="text-slate-500">Phone</dt>
              <dd className="text-slate-900">{employee.phoneNumber ?? "—"}</dd>
              <dt className="text-slate-500">Gender</dt>
              <dd className="text-slate-900">{employee.gender ?? "—"}</dd>
              <dt className="text-slate-500">Date of birth</dt>
              <dd className="text-slate-900">{employee.dateOfBirth?.slice(0, 10) ?? "—"}</dd>
              <dt className="text-slate-500">Job title</dt>
              <dd className="text-slate-900">{employee.jobTitle ?? "—"}</dd>
              <dt className="text-slate-500">Designation</dt>
              <dd className="text-slate-900">{employee.designationName ?? "—"}</dd>
              <dt className="text-slate-500">Department</dt>
              <dd className="text-slate-900">{employee.departmentName ?? "—"}</dd>
              <dt className="text-slate-500">Reporting to</dt>
              <dd className="text-slate-900">{employee.reportingToName ?? "—"}</dd>
              <dt className="text-slate-500">Role</dt>
              <dd className="text-slate-900">{employee.role ?? "—"}</dd>
              <dt className="text-slate-500">Employment type</dt>
              <dd className="text-slate-900">{employee.employmentType}</dd>
              <dt className="text-slate-500">Joining date</dt>
              <dd className="text-slate-900">{employee.joiningDate.slice(0, 10)}</dd>
              <dt className="text-slate-500">Termination date</dt>
              <dd className="text-slate-900">{employee.terminationDate?.slice(0, 10) ?? "—"}</dd>
            </dl>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone number">
                  <Input
                    value={form.phoneNumber}
                    onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                  />
                </Field>
                <Field label="Gender">
                  <Select
                    value={form.gender}
                    onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as Gender }))}
                  >
                    <option value="">Not specified</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date of birth">
                  <Input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                  />
                </Field>
                <Field label="Job title">
                  <Input
                    value={form.jobTitle}
                    onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                <Field label="Designation">
                  <Select
                    value={form.designationId}
                    onChange={(e) => setForm((f) => ({ ...f, designationId: e.target.value }))}
                  >
                    <option value="">None</option>
                    {designations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Reporting to">
                  <Select
                    value={form.reportingToId}
                    onChange={(e) => setForm((f) => ({ ...f, reportingToId: e.target.value }))}
                  >
                    <option value="">None</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Employment type">
                  <Select
                    value={form.employmentType}
                    onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value as EmploymentType }))}
                  >
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Termination date" helperText="Leave blank if still employed">
                <Input
                  type="date"
                  value={form.terminationDate}
                  onChange={(e) => setForm((f) => ({ ...f, terminationDate: e.target.value }))}
                />
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

          <EmployeeDocumentsPanel employeeId={employee.id} />

          <EmployeeLeaveAllocationsPanel employeeId={employee.id} />
        </div>

        <div className="lg:col-span-1">
          <DutyScheduleMonthCalendar employeeId={employee.id} compact />
        </div>
      </div>
    </div>
  );
}
