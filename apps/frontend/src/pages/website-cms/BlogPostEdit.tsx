import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Card, Field, Input, PageHeader, Spinner, Textarea } from "@hrm-plus/ui";
import { RichTextEditor } from "../../components/RichTextEditor";
import { getBlogPost, updateBlogPost } from "../../api/blogPosts";
import { resolveFileUrl } from "../../utils/fileUrl";

export default function BlogPostEdit() {
  const { id } = useParams();
  const postId = Number(id);

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null);
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    getBlogPost(postId)
      .then((post) => {
        setTitle(post.title);
        setExcerpt(post.excerpt ?? "");
        setContent(post.content);
        setAuthorName(post.authorName ?? "");
        setFeaturedImageUrl(post.featuredImageUrl);
        setStatus(post.status);
      })
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load blog post"))
      .finally(() => setLoading(false));
  }, [postId]);

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    setFeaturedImage(e.target.files?.[0] ?? null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updateBlogPost(
        postId,
        { title, excerpt: excerpt || undefined, content, authorName: authorName || undefined },
        featuredImage ?? undefined
      );
      setFeaturedImageUrl(updated.featuredImageUrl);
      setFeaturedImage(null);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to update blog post");
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
          <span className="flex items-center gap-3">
            <Link to="/website-cms/blog" className="text-brand-600 hover:underline">
              Back to blog
            </Link>
            <span className="text-slate-400">Status: {status}</span>
          </span>
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

          <Field label="Author name">
            <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
          </Field>

          <Field label="Replace featured image" helperText="Leave empty to keep the current image">
            {featuredImageUrl && (
              <div className="mb-2 h-20 w-32 overflow-hidden rounded border border-slate-200 bg-slate-50">
                <img src={resolveFileUrl(featuredImageUrl) ?? undefined} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageChange}
              className="block w-full text-sm text-slate-600"
            />
          </Field>

          <Field label="Excerpt" helperText="Shown in the blog grid preview">
            <Textarea rows={3} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} maxLength={500} />
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
