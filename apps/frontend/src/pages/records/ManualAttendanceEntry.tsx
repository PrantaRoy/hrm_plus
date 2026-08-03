import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DepartmentDto, EmployeeDto } from "@hrm-plus/shared";
import { Button, Card, Checkbox, Field, Input, PageHeader, Select, Textarea } from "@hrm-plus/ui";
import { setManualAttendance } from "../../api/attendance";
import { listDepartments } from "../../api/departments";
import { listEmployees } from "../../api/employees";

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function ManualAttendanceEntry() {
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);

  const [departmentId, setDepartmentId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(toDateInput(new Date()));
  const [checkInTime, setCheckInTime] = useState("09:00");
  const [checkOutTime, setCheckOutTime] = useState("17:00");
  const [includeCheckOut, setIncludeCheckOut] = useState(true);
  const [note, setNote] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listDepartments().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    listEmployees({ pageSize: 500, departmentId: departmentId ? Number(departmentId) : undefined })
      .then((res) => setEmployees(res.items))
      .catch(() => setEmployees([]));
    setEmployeeId("");
  }, [departmentId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!employeeId) {
      setError("Select an employee");
      return;
    }
    setSubmitting(true);
    try {
      const result = await setManualAttendance(Number(employeeId), {
        date,
        checkInTime,
        checkOutTime: includeCheckOut ? checkOutTime : undefined,
        note: note.trim() || undefined,
      });
      const employee = employees.find((e) => e.id === Number(employeeId));
      setSuccess(
        `Saved attendance for ${employee ? `${employee.firstName} ${employee.lastName}` : "employee"} on ${date}.` +
          (result.isLate ? " Marked late." : "") +
          (result.isEarlyCheckout ? " Marked early checkout." : "")
      );
      setNote("");
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to save manual attendance entry");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader
        title="Add Manual Attendance"
        description="Record actual check-in/check-out times for a staff member who already has a duty schedule assignment on this date."
        actions={
          <Link to="/records/attendance" className="text-sm text-brand-600 hover:underline">
            Back to Attendance Report
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}
        {success && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
            {success}
          </div>
        )}

        <Card title="Entry details">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Department">
                <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                  <option value="">All departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Employee" required>
                <Select required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                  <option value="">Select employee</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Date" required helperText="Must already have a duty schedule assignment on this date">
              <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Check-in time" required>
                <Input type="time" required value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
              </Field>
              <Field label="Check-out time">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-slate-500">
                    <Checkbox checked={includeCheckOut} onChange={(e) => setIncludeCheckOut(e.target.checked)} />
                    Include check-out
                  </label>
                  <Input
                    type="time"
                    disabled={!includeCheckOut}
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                  />
                </div>
              </Field>
            </div>

            <Field label="Note" helperText="Optional — shown on the attendance report for this entry">
              <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Forgot to punch, confirmed via CCTV" />
            </Field>
          </div>
        </Card>

        <Button type="submit" isLoading={submitting} className="w-full">
          Save Attendance
        </Button>
      </form>
    </div>
  );
}
