import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TicketCategoryDto } from "@hrm-plus/shared";
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from "@hrm-plus/ui";
import { createSupportTicket } from "../../api/supportTickets";
import { listTicketCategories } from "../../api/ticketCategories";

export default function NewTicket() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<TicketCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  useEffect(() => {
    listTicketCategories()
      .then(setCategories)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load ticket categories"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!categoryId) {
      setError("Select a category");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await createSupportTicket({
        categoryId: Number(categoryId),
        subject,
        message,
        attachment: attachment ?? undefined,
      });
      navigate(`/support-tickets/${created.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl space-y-5">
      <PageHeader title="New Support Ticket" description="Tell us what's going on and we'll get back to you." />

      <Card>
        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
            )}

            <Field label="Category" required>
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Select…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Subject" required>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} required />
            </Field>

            <Field label="Message" required>
              <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required />
            </Field>

            <Field label="Attachment" helperText="Optional — PDF, image, or Word document, up to 10MB">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf,.doc,.docx"
                onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
              />
            </Field>

            <Button type="submit" isLoading={submitting}>
              Submit Ticket
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
