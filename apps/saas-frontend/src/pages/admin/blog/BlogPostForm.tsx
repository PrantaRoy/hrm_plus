import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CreateSaasBlogPostInput, SaasBlogPostDto } from "@hrm-plus/shared";
import { Button, Card, Field, Input, PageHeader, Spinner, Textarea } from "@hrm-plus/ui";
import {
  createBlogPost,
  getBlogPost,
  publishBlogPost,
  updateBlogPost,
} from "../../../api/blog";
import { MarkdownContent } from "../../../components/MarkdownContent";
import { resolveFileUrl } from "../../../utils/fileUrl";

export default function BlogPostForm() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();

  const [loaded, setLoaded] = useState(isNew);
  const [existing, setExisting] = useState<SaasBlogPostDto | null>(null);
  const [form, setForm] = useState<CreateSaasBlogPostInput>({
    title: "",
    excerpt: "",
    contentMarkdown: "",
    authorName: "",
    metaDescription: "",
  });
  const [cover, setCover] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    getBlogPost(Number(id))
      .then((post) => {
        setExisting(post);
        setForm({
          title: post.title,
          excerpt: post.excerpt ?? "",
          contentMarkdown: post.contentMarkdown,
          authorName: post.authorName ?? "",
          metaDescription: post.metaDescription ?? "",
        });
        setLoaded(true);
      })
      .catch(() => setError("Failed to load post"));
  }, [id, isNew]);

  function set<K extends keyof CreateSaasBlogPostInput>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(publishAfter: boolean) {
    setSaving(true);
    setError(null);
    try {
      let saved: SaasBlogPostDto;
      if (isNew) {
        saved = await createBlogPost(form, cover);
      } else {
        saved = await updateBlogPost(Number(id), form, cover);
      }
      if (publishAfter && saved.status !== "PUBLISHED") {
        await publishBlogPost(saved.id);
      }
      navigate("/admin/blog");
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
          ?.message ?? "Save failed"
      );
      setSaving(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    save(false);
  }

  if (!loaded) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const coverUrl = resolveFileUrl(existing?.coverImageUrl);

  return (
    <form onSubmit={onSubmit} className="space-y-4 pb-16">
      <PageHeader
        title={isNew ? "New Post" : "Edit Post"}
        description={existing ? `Status: ${existing.status}` : "Draft"}
        actions={
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => navigate("/admin/blog")}>
              Cancel
            </Button>
            <Button type="submit" size="sm" variant="secondary" isLoading={saving}>
              Save draft
            </Button>
            <Button type="button" size="sm" isLoading={saving} onClick={() => save(true)}>
              Save &amp; publish
            </Button>
          </div>
        }
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <div className="space-y-4">
          <Field label="Title" required>
            <Input required value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Author name">
              <Input value={form.authorName ?? ""} onChange={(e) => set("authorName", e.target.value)} />
            </Field>
            <Field label="Cover image">
              <div className="flex items-center gap-3">
                {coverUrl && (
                  <img src={coverUrl} alt="" className="h-10 w-16 rounded border border-slate-200 object-cover" />
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setCover(e.target.files?.[0] ?? null)}
                  className="text-sm text-slate-600"
                />
              </div>
            </Field>
          </div>
          <Field label="Excerpt" helperText="Short summary shown on cards and previews">
            <Textarea
              rows={2}
              value={form.excerpt ?? ""}
              onChange={(e) => set("excerpt", e.target.value)}
            />
          </Field>
          <Field label="Meta description" helperText="For search engines and link previews">
            <Textarea
              rows={2}
              value={form.metaDescription ?? ""}
              onChange={(e) => set("metaDescription", e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card
        title="Content (Markdown)"
        actions={
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? "Hide preview" : "Show preview"}
          </Button>
        }
      >
        <div className={`grid gap-4 ${showPreview ? "lg:grid-cols-2" : ""}`}>
          <Textarea
            required
            rows={24}
            value={form.contentMarkdown}
            onChange={(e) => set("contentMarkdown", e.target.value)}
            className="font-mono text-xs"
          />
          {showPreview && (
            <div className="max-h-[36rem] overflow-y-auto rounded-md border border-slate-200 p-4">
              <MarkdownContent markdown={form.contentMarkdown} />
            </div>
          )}
        </div>
      </Card>
    </form>
  );
}
