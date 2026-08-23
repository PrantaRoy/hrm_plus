import { useEffect, useState } from "react";
import { WorksheetRowDto } from "@hrm-plus/shared";
import { EmptyState, Field, Input, Select, Spinner, Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@hrm-plus/ui";
import { getMyWorksheet } from "../../api/attendance";

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

export default function MyWorksheet() {
  const [tenure, setTenure] = useState<Tenure>("Weekly");
  const [anchor, setAnchor] = useState(toDateInput(new Date()));

  const [rows, setRows] = useState<WorksheetRowDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { startDate, endDate } = computeRange(tenure, anchor);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getMyWorksheet({ startDate, endDate })
      .then(setRows)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load worksheet"))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

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
            <TableHeaderCell>Days Present</TableHeaderCell>
            <TableHeaderCell>Total Hours</TableHeaderCell>
            <TableHeaderCell>Total Break</TableHeaderCell>
            <TableHeaderCell>Working Hours</TableHeaderCell>
          </tr>
        </TableHead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={4} className="py-12">
                <div className="flex justify-center">
                  <Spinner />
                </div>
              </td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={4}>
                <EmptyState title="No worksheet data" description="No attendance found for the selected period." />
              </td>
            </tr>
          )}
          {!loading &&
            rows.map((row) => (
              <TableRow key={row.employeeId}>
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
