import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Field, Input, PageHeader } from "@hrm-plus/ui";
import { RichTextEditor } from "../../components/RichTextEditor";
import { createLegalPage } from "../../api/legalPages";

export default function LegalPageCreate() {
  const navigate = useNavigate();
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await createLegalPage({ slug, title, content });
      navigate(`/website-cms/legal-pages/${created.id}/edit`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to create legal page");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader title="New Legal Page" description="e.g. Privacy Policy, Terms of Service." />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

          <Field label="Title" required>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Privacy Policy" />
          </Field>

          <Field label="Slug" required helperText="Lowercase letters, numbers, and hyphens only. Cannot be changed later.">
            <Input required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="privacy-policy" />
          </Field>

          <Field label="Content" required>
            <RichTextEditor value={content} onChange={setContent} />
          </Field>

          <Button type="submit" isLoading={submitting}>
            Create Page
          </Button>
        </form>
      </Card>
    </div>
  );
}
