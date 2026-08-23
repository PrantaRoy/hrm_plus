import { useEffect, useState } from "react";
import { ListAttendanceItemDto } from "@hrm-plus/shared";
import {
  Badge,
  EmptyState,
  Field,
  Input,
  Spinner,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import { listMyAttendance } from "../../api/attendance";

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function MyAttendanceReport() {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const [startDate, setStartDate] = useState(toDateInput(weekAgo));
  const [endDate, setEndDate] = useState(toDateInput(today));

  const [items, setItems] = useState<ListAttendanceItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listMyAttendance({ startDate, endDate })
      .then(setItems)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load attendance records"))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="From">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="To">
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}

      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Date</TableHeaderCell>
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
                <EmptyState title="No attendance records" description="No records found for the selected dates." />
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
