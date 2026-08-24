import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SupportTicketDto } from "@hrm-plus/shared";
import { Button, Card, PageHeader, StatusPill, Textarea } from "@hrm-plus/ui";
import { getMySupportTicket, replyToSupportTicket } from "../../api/supportTickets";
import { resolveFileUrl } from "../../utils/fileUrl";

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<SupportTicketDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function refresh() {
    if (!id) return;
    setLoading(true);
    getMySupportTicket(Number(id))
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
      const updated = await replyToSupportTicket(Number(id), { message, attachment: attachment ?? undefined });
      setTicket(updated);
      setMessage("");
      setAttachment(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to send reply");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-400">Loading...</p>;
  if (!ticket) return <p className="text-sm text-red-600">{error ?? "Ticket not found"}</p>;

  const isClosed = ticket.status === "Closed";

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader
        title={ticket.subject}
        description={`${ticket.categoryName} · Opened ${ticket.createdAt.slice(0, 10)}`}
        actions={
          <Button variant="secondary" onClick={() => navigate("/support-tickets")}>
            Back to tickets
          </Button>
        }
      />

      <Card>
        <div className="mb-4 flex items-center gap-3">
          <StatusPill status={ticket.status} />
          {ticket.priority && <span className="text-sm text-slate-500">Priority: {ticket.priority}</span>}
        </div>

        <div className="space-y-4">
          <ThreadMessage
            authorLabel={ticket.createdByName}
            createdAt={ticket.createdAt}
            message={ticket.message}
            attachmentFileUrl={ticket.attachmentFileUrl}
          />
          {ticket.replies?.map((reply) => (
            <ThreadMessage
              key={reply.id}
              authorLabel={reply.authorType === "SaasAdmin" ? "Support Team" : reply.authorName}
              createdAt={reply.createdAt}
              message={reply.message}
              attachmentFileUrl={reply.attachmentFileUrl}
              highlight={reply.authorType === "SaasAdmin"}
            />
          ))}
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}

        {isClosed ? (
          <p className="mt-6 text-sm text-slate-400">This ticket is closed. It can no longer be replied to.</p>
        ) : (
          <form onSubmit={handleReply} className="mt-6 space-y-3 border-t border-slate-200 pt-4">
            <Textarea
              rows={3}
              placeholder="Write a reply…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
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
