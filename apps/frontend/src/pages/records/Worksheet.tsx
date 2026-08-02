import { useEffect, useState } from "react";
import { DepartmentDto, EmployeeDto, WorksheetRowDto } from "@hrm-plus/shared";
import {
  EmptyState,
  Field,
  Input,
  Select,
  Spinner,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import { getWorksheet } from "../../api/attendance";
import { listDepartments } from "../../api/departments";
import { listEmployees } from "../../api/employees";

type Tenure = "Weekly" | "Fortnightly" | "Monthly";

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function computeRange(tenure: Tenure, anchor: string): { startDate: string; endDate: string } {
  const anchorDate = new Date(`${anchor}T00:00:00Z`);
  if (tenure === "Monthly") {
    const start = new Date(Date.UTC(anchorDate.getUTCFullYear(), anchorDate.getUTCMonth(), 1));
    const end = new Date(Date.UTC(anchorDate.getUTCFullYear(), anchorDate.getUTCMonth() + 1, 0));
    return { startDate: toDateInput(start), endDate: toDateInput(end) };
  }
  const days = tenure === "Fortnightly" ? 13 : 6;
  const end = new Date(anchorDate);
  end.setUTCDate(end.getUTCDate() + days);
  return { startDate: toDateInput(anchorDate), endDate: toDateInput(end) };
}

function formatHoursMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export default function Worksheet() {
  const [tenure, setTenure] = useState<Tenure>("Weekly");
  const [anchor, setAnchor] = useState(toDateInput(new Date()));
  const [departmentId, setDepartmentId] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [rows, setRows] = useState<WorksheetRowDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDepartments().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    listEmployees({ pageSize: 500, departmentId: departmentId ? Number(departmentId) : undefined })
      .then((res) => setEmployees(res.items))
      .catch(() => setEmployees([]));
    setEmployeeId("");
  }, [departmentId]);

  const { startDate, endDate } = computeRange(tenure, anchor);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getWorksheet({
      startDate,
      endDate,
      departmentId: departmentId ? Number(departmentId) : undefined,
      employeeId: employeeId ? Number(employeeId) : undefined,
    })
      .then(setRows)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load worksheet"))
      .finally(() => setLoading(false));
  }, [startDate, endDate, departmentId, employeeId]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Tenure">
          <Select value={tenure} onChange={(e) => setTenure(e.target.value as Tenure)}>
            <option value="Weekly">Weekly</option>
            <option value="Fortnightly">Fortnightly</option>
            <option value="Monthly">Monthly</option>
          </Select>
        </Field>
        <Field label={tenure === "Monthly" ? "Any date in month" : "Starting"}>
          <Input type="date" value={anchor} onChange={(e) => setAnchor(e.target.value)} />
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
      </div>

      <p className="text-xs text-slate-400">
        Period: {startDate} to {endDate}
      </p>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}

      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Employee</TableHeaderCell>
            <TableHeaderCell>Department</TableHeaderCell>
            <TableHeaderCell>Days Present</TableHeaderCell>
            <TableHeaderCell>Total Hours</TableHeaderCell>
            <TableHeaderCell>Total Break</TableHeaderCell>
            <TableHeaderCell>Working Hours</TableHeaderCell>
          </tr>
        </TableHead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={6} className="py-12">
                <div className="flex justify-center">
                  <Spinner />
                </div>
              </td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={6}>
                <EmptyState title="No worksheet data" description="No attendance found for the selected period." />
              </td>
            </tr>
          )}
          {!loading &&
            rows.map((row) => (
              <TableRow key={row.employeeId}>
                <TableCell className="font-medium text-slate-900">
                  {row.employeeName}
                  {row.employeeCode ? <span className="ml-1 text-xs text-slate-400">({row.employeeCode})</span> : null}
                </TableCell>
                <TableCell>{row.departmentName ?? "—"}</TableCell>
                <TableCell>{row.daysPresent}</TableCell>
                <TableCell>{formatHoursMinutes(row.totalMinutes)}</TableCell>
                <TableCell>{formatHoursMinutes(row.totalBreakMinutes)}</TableCell>
                <TableCell className="font-medium text-slate-900">{formatHoursMinutes(row.workingMinutes)}</TableCell>
              </TableRow>
            ))}
        </tbody>
      </Table>
    </div>
  );
}
