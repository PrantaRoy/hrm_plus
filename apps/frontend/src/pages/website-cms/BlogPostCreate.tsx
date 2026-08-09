import { ChangeEvent, FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Field, Input, PageHeader, Textarea } from "@hrm-plus/ui";
import { RichTextEditor } from "../../components/RichTextEditor";
import { createBlogPost } from "../../api/blogPosts";

export default function BlogPostCreate() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    setFeaturedImage(e.target.files?.[0] ?? null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await createBlogPost(
        { title, excerpt: excerpt || undefined, content, authorName: authorName || undefined },
        featuredImage ?? undefined
      );
      navigate(`/website-cms/blog/${created.id}/edit`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to create blog post");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader title="New Blog Post" />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

          <Field label="Title" required>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>

          <Field label="Author name">
            <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
          </Field>

          <Field label="Featured image">
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
            Create Post
          </Button>
        </form>
      </Card>
    </div>
  );
}
