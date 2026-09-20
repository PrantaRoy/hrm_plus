import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  SUPPORT_TICKET_PRIORITIES,
  SUPPORT_TICKET_STATUSES,
  SupportTicketDto,
  SupportTicketPriority,
  SupportTicketStatus,
  TicketCategoryDto,
} from "@hrm-plus/shared";
import { Alert, Button, Card, Field, Input, PageHeader, Select, StatusPill, Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@hrm-plus/ui";
import { listAdminSupportTickets } from "../../../api/supportTickets";
import { listAdminTicketCategories } from "../../../api/ticketCategories";

export default function TicketList() {
  const [tickets, setTickets] = useState<SupportTicketDto[]>([]);
  const [categories, setCategories] = useState<TicketCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    listAdminTicketCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  function refresh() {
    setLoading(true);
    setError(null);
    listAdminSupportTickets({
      status: (status || undefined) as SupportTicketStatus | undefined,
      priority: (priority || undefined) as SupportTicketPriority | undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      pageSize: 50,
    })
      .then((res) => setTickets(res.items))
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load support tickets"))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(refresh, [status, priority, categoryId, dateFrom, dateTo]);

  return (
    <div className="space-y-4">
      <PageHeader title="Support Tickets" description="Tickets raised by companies on the platform." />

      <Card>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
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
          <Field label="Category">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
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

        {error && (
          <Alert className="mb-4">{error}</Alert>
        )}

        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Company</TableHeaderCell>
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
                <TableCell colSpan={7} className="text-center text-slate-400 py-6">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading && tickets.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-400 py-6">
                  No support tickets match these filters.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium text-slate-900">{ticket.tenantName}</TableCell>
                  <TableCell>{ticket.subject}</TableCell>
                  <TableCell>{ticket.categoryName}</TableCell>
                  <TableCell>{ticket.priority ?? "—"}</TableCell>
                  <TableCell>
                    <StatusPill status={ticket.status} />
                  </TableCell>
                  <TableCell>{ticket.createdAt.slice(0, 10)}</TableCell>
                  <TableCell className="text-right">
                    <Link to={`/admin/support-tickets/${ticket.id}`}>
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
