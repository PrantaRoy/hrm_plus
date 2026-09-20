import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  SUPPORT_TICKET_PRIORITIES,
  SUPPORT_TICKET_STATUSES,
  SupportTicketDto,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@hrm-plus/shared";
import { Alert, Button, Card, Field, PageHeader, Select, StatusPill, Textarea } from "@hrm-plus/ui";
import { getAdminSupportTicket, replyToAdminSupportTicket, updateAdminSupportTicketStatus } from "../../../api/supportTickets";

const FILE_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");

function resolveFileUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  return `${FILE_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<SupportTicketDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  function refresh() {
    if (!id) return;
    setLoading(true);
    getAdminSupportTicket(Number(id))
      .then(setTicket)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load ticket"))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(refresh, [id]);

  async function handleReply(e: FormEvent) {
    e.preventDefault();
    if (!id || !message.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await replyToAdminSupportTicket(Number(id), {
        message,
        priority: (priority || undefined) as SupportTicketPriority | undefined,
        attachment: attachment ?? undefined,
      });
      setTicket(updated);
      setMessage("");
      setPriority("");
      setAttachment(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to send reply");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(status: SupportTicketStatus) {
    if (!id) return;
    setStatusUpdating(true);
    setError(null);
    try {
      const updated = await updateAdminSupportTicketStatus(Number(id), status);
      setTicket(updated);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-400">Loading...</p>;
  if (!ticket) return <p className="text-sm text-red-600">{error ?? "Ticket not found"}</p>;

  const isClosed = ticket.status === "Closed";

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader
        title={ticket.subject}
        description={`${ticket.tenantName} · ${ticket.categoryName} · Opened ${ticket.createdAt.slice(0, 10)}`}
        actions={
          <Button variant="secondary" onClick={() => navigate("/admin/support-tickets")}>
            Back to tickets
          </Button>
        }
      />

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <StatusPill status={ticket.status} />
          {ticket.priority && <span className="text-sm text-slate-500">Priority: {ticket.priority}</span>}
          <div className="ml-auto flex gap-2">
            {SUPPORT_TICKET_STATUSES.filter((s) => s !== "Pending" && s !== ticket.status).map((s) => (
              <Button key={s} size="sm" variant="secondary" isLoading={statusUpdating} onClick={() => handleStatusChange(s)}>
                Mark {s}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <ThreadMessage
            authorLabel={`${ticket.createdByName} (${ticket.tenantName})`}
            createdAt={ticket.createdAt}
            message={ticket.message}
            attachmentFileUrl={ticket.attachmentFileUrl}
          />
          {ticket.replies?.map((reply) => (
            <ThreadMessage
              key={reply.id}
              authorLabel={reply.authorType === "SaasAdmin" ? "You (Support Team)" : reply.authorName}
              createdAt={reply.createdAt}
              message={reply.message}
              attachmentFileUrl={reply.attachmentFileUrl}
              highlight={reply.authorType === "SaasAdmin"}
            />
          ))}
        </div>

        {error && (
          <Alert className="mt-4">{error}</Alert>
        )}

        {isClosed ? (
          <p className="mt-6 text-sm text-slate-400">
            This ticket is closed. Reopen it (Mark Open above) to reply.
          </p>
        ) : (
          <form onSubmit={handleReply} className="mt-6 space-y-3 border-t border-slate-200 pt-4">
            <Textarea
              rows={3}
              placeholder="Write a reply…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            {!ticket.priority && (
              <Field label="Priority" required helperText="Required on the first reply to this ticket">
                <Select value={priority} onChange={(e) => setPriority(e.target.value)} required>
                  <option value="">Select…</option>
                  {SUPPORT_TICKET_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf,.doc,.docx"
              onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
            />
            <Button type="submit" isLoading={submitting}>
              Send Reply
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

function ThreadMessage({
  authorLabel,
  createdAt,
  message,
  attachmentFileUrl,
  highlight,
}: {
  authorLabel: string;
  createdAt: string;
  message: string;
  attachmentFileUrl: string | null;
  highlight?: boolean;
}) {
  const fileUrl = resolveFileUrl(attachmentFileUrl);
  return (
    <div className={`rounded-md border p-3 ${highlight ? "border-brand-200 bg-brand-50" : "border-slate-200"}`}>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
        <span className="font-medium text-slate-700">{authorLabel}</span>
        <span>{createdAt.slice(0, 16).replace("T", " ")}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm text-slate-700">{message}</p>
      {fileUrl && (
        <a href={fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-brand-600 underline">
          View attachment
        </a>
      )}
    </div>
  );
}
