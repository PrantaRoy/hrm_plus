import { useEffect, useState } from "react";
import { DepartmentDto, EmployeeDto, LeaveRequestDto, LeaveTypeDto } from "@hrm-plus/shared";
import {
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
import { listLeaveRequests } from "../../api/leaveRequests";
import { listDepartments } from "../../api/departments";
import { listEmployees } from "../../api/employees";
import { listLeaveTypes } from "../../api/leaveTypes";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export default function LeaveReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");

  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeDto[]>([]);
  const [items, setItems] = useState<LeaveRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDepartments().then(setDepartments).catch(() => setDepartments([]));
    listLeaveTypes().then(setLeaveTypes).catch(() => setLeaveTypes([]));
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
    listLeaveRequests({
      page: 1,
      pageSize: 100,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      departmentId: departmentId ? Number(departmentId) : undefined,
      employeeId: employeeId ? Number(employeeId) : undefined,
      leaveTypeId: leaveTypeId ? Number(leaveTypeId) : undefined,
    })
      .then((res) => setItems(res.items))
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load leave records"))
      .finally(() => setLoading(false));
  }, [startDate, endDate, departmentId, employeeId, leaveTypeId]);

  return (
    <div className="space-y-5">
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
        <Field label="Leave type">
          <Select value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)}>
            <option value="">All leave types</option>
            {leaveTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
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
            <TableHeaderCell>Employee</TableHeaderCell>
            <TableHeaderCell>Department</TableHeaderCell>
            <TableHeaderCell>Leave Type</TableHeaderCell>
            <TableHeaderCell>From</TableHeaderCell>
            <TableHeaderCell>To</TableHeaderCell>
            <TableHeaderCell>Days</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
          </tr>
        </TableHead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={7} className="py-12">
                <div className="flex justify-center">
                  <Spinner />
                </div>
              </td>
            </tr>
          )}
          {!loading && items.length === 0 && (
            <tr>
              <td colSpan={7}>
                <EmptyState title="No leave records" description="No records found for the selected filters." />
              </td>
            </tr>
          )}
          {!loading &&
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-slate-900">{item.employeeName}</TableCell>
                <TableCell>{item.departmentName ?? "—"}</TableCell>
                <TableCell>{item.leaveTypeName}</TableCell>
                <TableCell>{formatDate(item.startDate)}</TableCell>
                <TableCell>{formatDate(item.endDate)}</TableCell>
                <TableCell>{item.daysRequested}</TableCell>
                <TableCell>
                  <StatusPill status={item.status} />
                </TableCell>
              </TableRow>
            ))}
        </tbody>
      </Table>
    </div>
  );
}
