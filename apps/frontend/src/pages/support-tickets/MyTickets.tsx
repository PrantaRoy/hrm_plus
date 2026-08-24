import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  SUPPORT_TICKET_PRIORITIES,
  SUPPORT_TICKET_STATUSES,
  SupportTicketDto,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@hrm-plus/shared";
import {
  Button,
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
import { listMySupportTickets } from "../../api/supportTickets";

export default function MyTickets() {
  const [tickets, setTickets] = useState<SupportTicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  function refresh() {
    setLoading(true);
    setError(null);
    listMySupportTickets({
      status: (status || undefined) as SupportTicketStatus | undefined,
      priority: (priority || undefined) as SupportTicketPriority | undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      pageSize: 50,
    })
      .then((res) => setTickets(res.items))
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load support tickets"))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(refresh, [status, priority, dateFrom, dateTo]);

  return (
    <div className="space-y-5">
      <PageHeader title="Support Tickets" description="Tickets you've raised with the platform support team." />

      <Card>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              {SUPPORT_TICKET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">All</option>
              {SUPPORT_TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="From">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </Field>
          <Field label="To">
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </Field>
        </div>

        <div className="mb-4 flex justify-end">
          <Link to="/support-tickets/new">
            <Button>New Ticket</Button>
          </Link>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}

        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Subject</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>Priority</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Created</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-6">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading && tickets.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-6">
                  You haven't raised any support tickets yet.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium text-slate-900">{ticket.subject}</TableCell>
                  <TableCell>{ticket.categoryName}</TableCell>
                  <TableCell>{ticket.priority ?? "—"}</TableCell>
                  <TableCell>
                    <StatusPill status={ticket.status} />
                  </TableCell>
                  <TableCell>{ticket.createdAt.slice(0, 10)}</TableCell>
                  <TableCell className="text-right">
                    <Link to={`/support-tickets/${ticket.id}`}>
                      <Button size="sm" variant="secondary">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
