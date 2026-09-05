import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SaasContactStatus, SaasContactSubmissionDto } from "@hrm-plus/shared";
import { Badge, Button, Card, PageHeader, Spinner } from "@hrm-plus/ui";
import {
  deleteContactSubmission,
  getContactSubmission,
  updateContactSubmissionStatus,
} from "../../../api/contact";

export default function ContactInboxDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [row, setRow] = useState<SaasContactSubmissionDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getContactSubmission(Number(id))
      .then((data) => {
        setRow(data);
        if (data.status === "UNREAD") {
          updateContactSubmissionStatus(data.id, "READ").then(setRow).catch(() => undefined);
        }
      })
      .catch(() => setError("Message not found"));
  }, [id]);

  async function setStatus(status: SaasContactStatus) {
    if (!row) return;
    setRow(await updateContactSubmissionStatus(row.id, status));
  }

  async function remove() {
    if (!row) return;
    await deleteContactSubmission(row.id);
    navigate("/admin/contact");
  }

  if (error) {
    return <div className="text-sm text-slate-500">{error}</div>;
  }
  if (!row) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate("/admin/contact")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to inbox
      </button>

      <PageHeader
        title={row.subject ?? "Message"}
        description={`From ${row.name} · ${new Date(row.createdAt).toLocaleString()}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge color={row.status === "UNREAD" ? "amber" : row.status === "ARCHIVED" ? "green" : "slate"}>
              {row.status.charAt(0) + row.status.slice(1).toLowerCase()}
            </Badge>
            {row.status !== "ARCHIVED" ? (
              <Button size="sm" variant="secondary" onClick={() => setStatus("ARCHIVED")}>
                Archive
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setStatus("READ")}>
                Unarchive
              </Button>
            )}
            <Button size="sm" variant="danger" onClick={remove}>
              Delete
            </Button>
          </div>
        }
      />

      <Card>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-400">Email</dt>
            <dd>
              <a href={`mailto:${row.email}`} className="text-brand-700 hover:underline">
                {row.email}
              </a>
            </dd>
          </div>
          {row.phone && (
            <div>
              <dt className="text-slate-400">Phone</dt>
              <dd>{row.phone}</dd>
            </div>
          )}
          {row.company && (
            <div>
              <dt className="text-slate-400">Company</dt>
              <dd>{row.company}</dd>
            </div>
          )}
          {row.ipAddress && (
            <div>
              <dt className="text-slate-400">IP address</dt>
              <dd>{row.ipAddress}</dd>
            </div>
          )}
        </dl>
        <div className="mt-5 border-t border-slate-100 pt-5">
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{row.message}</p>
        </div>
      </Card>
    </div>
  );
}
