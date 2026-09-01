import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MEETING_STATUSES, MeetingListItemDto, MeetingStatus } from "@hrm-plus/shared";
import {
  Card,
  Field,
  Input,
  PageHeader,
  Select,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import { listMeetings } from "../../api/meetings";
import { apiErrorMessage } from "../../utils/apiError";

export default function AllMeetings() {
  const [items, setItems] = useState<MeetingListItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ status?: MeetingStatus; startDate: string; endDate: string }>({
    startDate: "",
    endDate: "",
  });

  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    listMeetings({
      page,
      pageSize,
      status: filters.status,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((err) => setError(apiErrorMessage(err, "Failed to load meetings")))
      .finally(() => setLoading(false));
  }, [page, filters]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-5">
      <PageHeader title="Meetings" description="All meetings across the organisation." />

      <Card>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Field label="Status">
            <Select
              value={filters.status ?? ""}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, status: (e.target.value || undefined) as MeetingStatus | undefined }));
              }}
            >
              <option value="">All</option>
              {MEETING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="From">
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, startDate: e.target.value }));
              }}
            />
          </Field>
          <Field label="To">
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, endDate: e.target.value }));
              }}
            />
          </Field>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}

        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Title</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Organizer</TableHeaderCell>
              <TableHeaderCell>Participants</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-6">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-6">
                  No meetings match these filters.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              items.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.title}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {new Date(m.startAt).toLocaleDateString()}{" "}
                    {new Date(m.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </TableCell>
                  <TableCell>{m.organizerName}</TableCell>
                  <TableCell>{m.participantCount}</TableCell>
                  <TableCell>
                    <StatusPill status={m.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/meetings/${m.id}`} className="text-sm text-brand-700 hover:underline">
                      Open
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
          </tbody>
        </Table>

        <div className="flex items-center justify-between pt-3 text-sm text-slate-500">
          <span>{total} meeting(s)</span>
          <span className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">
              Prev
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="disabled:opacity-40"
            >
              Next
            </button>
          </span>
        </div>
      </Card>
    </div>
  );
}
