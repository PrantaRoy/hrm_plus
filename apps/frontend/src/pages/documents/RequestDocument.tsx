import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DOCUMENT_PRIORITIES, DocumentTemplateDto } from "@hrm-plus/shared";
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from "@hrm-plus/ui";
import { createDocumentRequest, fetchDocumentRequestPreview } from "../../api/documentRequests";
import { listDocumentTemplates } from "../../api/documentTemplates";

export default function RequestDocument() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<DocumentTemplateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [templateId, setTemplateId] = useState("");
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState<string>("Medium");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  useEffect(() => {
    listDocumentTemplates()
      .then(setTemplates)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load document templates"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!templateId) {
      setError("Select a document type");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await createDocumentRequest({
        templateId: Number(templateId),
        reason: reason || undefined,
        priority,
        deadlineDate: deadlineDate || undefined,
        attachment: attachment ?? undefined,
      });
      const blob = await fetchDocumentRequestPreview(created.id);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to submit document request");
    } finally {
      setSubmitting(false);
    }
  }

  if (previewUrl) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Request Submitted"
          description="This is a watermarked demo preview. It will move through the approval chain before a final copy is issued."
        />
        <Card>
          <iframe title="Document preview" src={previewUrl} className="h-[720px] w-full rounded-md border border-slate-200" />
          <div className="mt-4 flex gap-2">
            <Button onClick={() => navigate("/documents/my-requests")}>Go to My Requests</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setPreviewUrl(null);
                setTemplateId("");
                setReason("");
                setAttachment(null);
                setDeadlineDate("");
              }}
            >
              Request Another Document
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-5">
      <PageHeader title="Request a Document" description="Submit a request for HR/Admin to review and issue." />

      <Card>
        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : templates.length === 0 ? (
          <p className="text-sm text-slate-500">
            No document types are available to request right now. Contact HR if you need one.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
            )}

            <Field label="Document type" required>
              <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                <option value="">Select…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Reason" helperText="Optional">
              <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Priority">
                <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {DOCUMENT_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Needed by" helperText="Optional deadline">
                <Input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} />
              </Field>
            </div>

            <Field label="Supporting attachment" helperText="Optional — PDF, PNG, JPEG, or WebP, up to 10MB">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
              />
            </Field>

            <Button type="submit" isLoading={submitting}>
              Submit Request
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
