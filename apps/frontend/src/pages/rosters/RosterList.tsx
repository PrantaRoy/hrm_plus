import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { DepartmentDto, PaginatedResult, RosterDto } from "@hrm-plus/shared";
import {
  Button,
  EmptyState,
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
import { listRosters } from "../../api/rosters";
import { listDepartments } from "../../api/departments";

const PAGE_SIZE = 10;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

export default function RosterList() {
  const [result, setResult] = useState<PaginatedResult<RosterDto> | null>(null);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listDepartments().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listRosters({
      page,
      pageSize: PAGE_SIZE,
      departmentId: departmentId ? Number(departmentId) : undefined,
      status: status || undefined,
    })
      .then((res) => {
        if (!cancelled) setResult(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [departmentId, status, page]);

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Rosters"
        description="Create and manage duty rosters for each department."
        actions={
          <Link
            to="/rosters/new"
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Create Roster
          </Link>
        }
      />

      <div className="flex flex-wrap gap-3">
        <Select
          value={departmentId}
          onChange={(e) => {
            setPage(1);
            setDepartmentId(e.target.value);
          }}
          className="w-56"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="w-44"
        >
          <option value="">All statuses</option>
          <option value="Draft">Draft</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
        </Select>
      </div>

      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Department</TableHeaderCell>
            <TableHeaderCell>Period Type</TableHeaderCell>
            <TableHeaderCell>Date Range</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Created By</TableHeaderCell>
            <TableHeaderCell>Action</TableHeaderCell>
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
          {!loading && result?.items.length === 0 && (
            <tr>
              <td colSpan={6}>
                <EmptyState title="No rosters found" description="Create a roster to get started." />
              </td>
            </tr>
          )}
          {!loading &&
            result?.items.map((roster) => (
              <TableRow key={roster.id}>
                <TableCell className="font-medium text-slate-900">{roster.departmentName ?? "—"}</TableCell>
                <TableCell>{roster.periodType}</TableCell>
                <TableCell>
                  {formatDate(roster.startDate)} – {formatDate(roster.endDate)}
                </TableCell>
                <TableCell>
                  <StatusPill status={roster.status} />
                </TableCell>
                <TableCell>{roster.createdByName ?? "—"}</TableCell>
                <TableCell>
                  <Link to={`/rosters/${roster.id}`} className="text-sm text-brand-600 hover:underline">
                    Open Calendar
                  </Link>
                </TableCell>
              </TableRow>
            ))}
        </tbody>
      </Table>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{result?.total ?? 0} total rosters</span>
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
