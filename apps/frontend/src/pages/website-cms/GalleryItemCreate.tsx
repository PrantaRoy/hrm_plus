import { ChangeEvent, FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Field, Input } from "@hrm-plus/ui";
import { PageHeader } from "@hrm-plus/ui";
import { createGalleryItem } from "../../api/galleryItems";

export default function GalleryItemCreate() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!image) {
      setError("Image file is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createGalleryItem(
        { title: title || undefined, caption: caption || undefined, category: category || undefined, isFeatured },
        image,
        thumbnail ?? undefined
      );
      navigate("/website-cms/gallery");
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to create gallery item");
    } finally {
      setSubmitting(false);
    }
  }

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    setImage(e.target.files?.[0] ?? null);
  }

  function handleThumbnailChange(e: ChangeEvent<HTMLInputElement>) {
    setThumbnail(e.target.files?.[0] ?? null);
  }

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="New Gallery Item" />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>

          <Field label="Caption">
            <Input value={caption} onChange={(e) => setCaption(e.target.value)} />
          </Field>

          <Field label="Category" helperText="e.g. Office, Events">
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
          </Field>

          <Field label="Image" required>
            <input
              type="file"
              required
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageChange}
              className="block w-full text-sm text-slate-600"
            />
          </Field>

          <Field label="Thumbnail" helperText="Optional — falls back to the image above">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleThumbnailChange}
              className="block w-full text-sm text-slate-600"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            Featured
          </label>

          <Button type="submit" isLoading={submitting}>
            Create Item
          </Button>
        </form>
      </Card>
    </div>
  );
}
