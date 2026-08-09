import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Card, Field, Input, PageHeader, Spinner } from "@hrm-plus/ui";
import { RichTextEditor } from "../../components/RichTextEditor";
import { getLegalPage, updateLegalPage } from "../../api/legalPages";

export default function LegalPageEdit() {
  const { id } = useParams();
  const pageId = Number(id);

  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    getLegalPage(pageId)
      .then((page) => {
        setSlug(page.slug);
        setTitle(page.title);
        setContent(page.content);
      })
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load legal page"))
      .finally(() => setLoading(false));
  }, [pageId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);
    try {
      await updateLegalPage(pageId, { title, content });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to update legal page");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader
        title={title}
        description={
          <Link to="/website-cms/legal-pages" className="text-brand-600 hover:underline">
            Back to legal pages
          </Link>
        }
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}
          {saved && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">Saved.</div>
          )}

          <Field label="Title" required>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>

          <Field label="Slug" helperText="Cannot be changed after creation">
            <Input readOnly value={slug} className="font-mono text-xs" />
          </Field>

          <Field label="Content" required>
            <RichTextEditor value={content} onChange={setContent} />
          </Field>

          <Button type="submit" isLoading={submitting}>
            Save Changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
