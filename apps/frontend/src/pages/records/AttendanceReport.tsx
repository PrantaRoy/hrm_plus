import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { DepartmentDto, DutyScheduleDto, EmployeeDto, ListAttendanceItemDto } from "@hrm-plus/shared";
import {
  Badge,
  EmptyState,
  Field,
  Input,
  Select,
  Spinner,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import { listAttendance } from "../../api/attendance";
import { listDepartments } from "../../api/departments";
import { listEmployees } from "../../api/employees";
import { listDutySchedules } from "../../api/dutySchedules";
import { useAuth } from "../../auth/AuthContext";
import { formatDutyScheduleOption } from "../../utils/dutySchedule";

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function AttendanceReport() {
  const { user } = useAuth();
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const [startDate, setStartDate] = useState(toDateInput(weekAgo));
  const [endDate, setEndDate] = useState(toDateInput(today));
  const [departmentId, setDepartmentId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [dutyScheduleId, setDutyScheduleId] = useState("");

  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [dutySchedules, setDutySchedules] = useState<DutyScheduleDto[]>([]);
  const [items, setItems] = useState<ListAttendanceItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDepartments().then(setDepartments).catch(() => setDepartments([]));
    listDutySchedules({ pageSize: 200 }).then((res) => setDutySchedules(res.items)).catch(() => setDutySchedules([]));
  }, []);

  useEffect(() => {
    listEmployees({ pageSize: 500, departmentId: departmentId ? Number(departmentId) : undefined })
      .then((res) => setEmployees(res.items))
      .catch(() => setEmployees([]));
    setEmployeeId("");
  }, [departmentId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listAttendance({
      startDate,
      endDate,
      departmentId: departmentId ? Number(departmentId) : undefined,
      employeeId: employeeId ? Number(employeeId) : undefined,
      dutyScheduleId: dutyScheduleId ? Number(dutyScheduleId) : undefined,
    })
      .then(setItems)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load attendance records"))
      .finally(() => setLoading(false));
  }, [startDate, endDate, departmentId, employeeId, dutyScheduleId]);

  return (
    <div className="space-y-5">
      {(user?.role === "Admin" || user?.role === "HR") && (
        <div className="flex justify-end">
          <Link
            to="/records/attendance/manual"
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Add Manual Entry
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <Field label="From">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="To">
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
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
        <Field label="Employee">
          <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">All employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Duty schedule">
          <Select value={dutyScheduleId} onChange={(e) => setDutyScheduleId(e.target.value)}>
            <option value="">All duty schedules</option>
            {dutySchedules.map((d) => (
              <option key={d.id} value={d.id}>
                {formatDutyScheduleOption(d)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}

      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Date</TableHeaderCell>
            <TableHeaderCell>Employee</TableHeaderCell>
            <TableHeaderCell>Duty Schedule</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Check-in</TableHeaderCell>
            <TableHeaderCell>Check-out</TableHeaderCell>
            <TableHeaderCell>Break (min)</TableHeaderCell>
            <TableHeaderCell>Notes</TableHeaderCell>
          </tr>
        </TableHead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={8} className="py-12">
                <div className="flex justify-center">
                  <Spinner />
                </div>
              </td>
            </tr>
          )}
          {!loading && items.length === 0 && (
            <tr>
              <td colSpan={8}>
                <EmptyState title="No attendance records" description="No records found for the selected filters." />
              </td>
            </tr>
          )}
          {!loading &&
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {new Date(item.date).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </TableCell>
                <TableCell className="font-medium text-slate-900">
                  {item.employeeName}
                  {item.employeeCode ? <span className="ml-1 text-xs text-slate-400">({item.employeeCode})</span> : null}
                </TableCell>
                <TableCell>{item.dutyScheduleName ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <StatusPill status={item.status} />
                    {item.isManualEntry && <Badge color="brand">Manual</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  {formatTime(item.checkInAt)}
                  {item.isLate && <span className="ml-1 text-xs text-amber-600">(late)</span>}
                </TableCell>
                <TableCell>
                  {formatTime(item.checkOutAt)}
                  {item.isEarlyCheckout && <span className="ml-1 text-xs text-amber-600">(early)</span>}
                </TableCell>
                <TableCell>{item.totalBreakMinutes}</TableCell>
                <TableCell className="max-w-xs truncate text-xs text-slate-500">
                  {item.manualEntryNote ?? item.lateReason ?? item.earlyCheckoutReason ?? "—"}
                </TableCell>
              </TableRow>
            ))}
        </tbody>
      </Table>
    </div>
  );
}
