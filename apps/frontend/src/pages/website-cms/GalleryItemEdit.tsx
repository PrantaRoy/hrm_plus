import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Card, Field, Input, PageHeader, Spinner } from "@hrm-plus/ui";
import { listGalleryItems, updateGalleryItem } from "../../api/galleryItems";
import { resolveFileUrl } from "../../utils/fileUrl";

export default function GalleryItemEdit() {
  const { id } = useParams();
  const itemId = Number(id);

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    listGalleryItems()
      .then((items) => {
        const item = items.find((i) => i.id === itemId);
        if (!item) {
          setError("Gallery item not found");
          return;
        }
        setTitle(item.title ?? "");
        setCaption(item.caption ?? "");
        setCategory(item.category ?? "");
        setIsFeatured(item.isFeatured);
        setImageUrl(item.thumbnailUrl ?? item.imageUrl);
      })
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load gallery item"))
      .finally(() => setLoading(false));
  }, [itemId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const updated = await updateGalleryItem(
        itemId,
        { title: title || undefined, caption: caption || undefined, category: category || undefined, isFeatured },
        image ?? undefined,
        thumbnail ?? undefined
      );
      setImageUrl(updated.thumbnailUrl ?? updated.imageUrl);
      setImage(null);
      setThumbnail(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to update gallery item");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader
        title={title || "Gallery item"}
        description={
          <Link to="/website-cms/gallery" className="text-brand-600 hover:underline">
            Back to gallery
          </Link>
        }
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

          {imageUrl && (
            <div className="h-24 w-36 overflow-hidden rounded border border-slate-200 bg-slate-50">
              <img src={resolveFileUrl(imageUrl) ?? undefined} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>

          <Field label="Caption">
            <Input value={caption} onChange={(e) => setCaption(e.target.value)} />
          </Field>

          <Field label="Category" helperText="e.g. Office, Events">
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
          </Field>

          <Field label="Replace image" helperText="Leave empty to keep the current image">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageChange}
              className="block w-full text-sm text-slate-600"
            />
          </Field>

          <Field label="Replace thumbnail" helperText="Leave empty to keep the current thumbnail">
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
            Save Changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
