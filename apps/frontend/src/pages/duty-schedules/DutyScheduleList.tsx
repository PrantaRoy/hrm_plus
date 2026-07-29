import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { DutyScheduleDto, PaginatedResult } from "@hrm-plus/shared";
import {
  Button,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Spinner,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import { deleteDutySchedule, listDutySchedules } from "../../api/dutySchedules";

export default function DutyScheduleList() {
  const [result, setResult] = useState<PaginatedResult<DutyScheduleDto> | null>(null);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  function refresh() {
    let cancelled = false;
    setLoading(true);
    listDutySchedules({ page, pageSize, search: search || undefined })
      .then((res) => {
        if (!cancelled) setResult(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }

  useEffect(refresh, [search, pageSize, page]);

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this duty schedule?")) return;
    await deleteDutySchedule(id);
    refresh();
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.total / pageSize)) : 1;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Duty Schedule"
        description="Define shifts and their attendance rules before building a roster."
        actions={
          <Link
            to="/duty-schedules/new"
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Create
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={pageSize}
          onChange={(e) => {
            setPage(1);
            setPageSize(Number(e.target.value));
          }}
          className="w-24"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </Select>
        <div className="relative w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Enter keyword.."
            className="pl-9"
          />
        </div>
      </div>

      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>SL</TableHeaderCell>
            <TableHeaderCell>Shift</TableHeaderCell>
            <TableHeaderCell>Start Time</TableHeaderCell>
            <TableHeaderCell>End Time</TableHeaderCell>
            <TableHeaderCell>Hours</TableHeaderCell>
            <TableHeaderCell>Checkin Consider</TableHeaderCell>
            <TableHeaderCell>Checkout Consider</TableHeaderCell>
            <TableHeaderCell>Max Over Time</TableHeaderCell>
            <TableHeaderCell>Early Check-in Buffer</TableHeaderCell>
            <TableHeaderCell>Is Tardy Applicable</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Action</TableHeaderCell>
          </tr>
        </TableHead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={12} className="py-12">
                <div className="flex justify-center">
                  <Spinner />
                </div>
              </td>
            </tr>
          )}
          {!loading && result?.items.length === 0 && (
            <tr>
              <td colSpan={12}>
                <EmptyState title="No duty schedules found" description="Create one to get started." />
              </td>
            </tr>
          )}
          {!loading &&
            result?.items.map((ds, idx) => (
              <TableRow key={ds.id}>
                <TableCell>{(page - 1) * pageSize + idx + 1}</TableCell>
                <TableCell className="font-medium text-slate-900">{ds.name}</TableCell>
                <TableCell>{ds.startTime}</TableCell>
                <TableCell>{ds.endTime}</TableCell>
                <TableCell>{ds.hours}</TableCell>
                <TableCell>{ds.checkinConsiderMinutes} min</TableCell>
                <TableCell>{ds.checkoutConsiderMinutes} min</TableCell>
                <TableCell>{ds.maxOverTimeMinutes} min</TableCell>
                <TableCell>{ds.earlyCheckinBufferMinutes} min</TableCell>
                <TableCell>{ds.isTardyApplicable ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <StatusPill status={ds.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link to={`/duty-schedules/${ds.id}/edit`} className="text-sm text-brand-600 hover:underline">
                      Edit
                    </Link>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(ds.id)}>
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </tbody>
      </Table>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{result?.total ?? 0} total duty schedules</span>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
