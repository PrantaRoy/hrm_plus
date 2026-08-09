import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GalleryItemDto } from "@hrm-plus/shared";
import { Button, PageHeader, Spinner } from "@hrm-plus/ui";
import { deleteGalleryItem, listGalleryItems, reorderGalleryItems } from "../../api/galleryItems";
import { SortableList } from "../../components/SortableList";
import { resolveFileUrl } from "../../utils/fileUrl";

export default function GalleryItemList() {
  const [items, setItems] = useState<GalleryItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    listGalleryItems()
      .then(setItems)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load gallery items"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this gallery item?")) return;
    setError(null);
    try {
      await deleteGalleryItem(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to delete gallery item");
    }
  }

  async function handleReorder(orderedIds: number[]) {
    setError(null);
    const previous = items;
    const byId = new Map(items.map((i) => [i.id, i]));
    setItems(orderedIds.map((id) => byId.get(id)!).filter(Boolean));
    try {
      await reorderGalleryItems(orderedIds);
    } catch (err: any) {
      setItems(previous);
      setError(err.response?.data?.error?.message ?? "Failed to reorder gallery items");
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader
        title="Gallery"
        description="Drag to reorder. Shown in the public website's Gallery section."
        actions={
          <Link
            to="/website-cms/gallery/new"
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            New Item
          </Link>
        }
      />

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">No gallery items yet.</p>
      ) : (
        <SortableList
          items={items}
          onReorder={handleReorder}
          renderItem={(item) => (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-14 overflow-hidden rounded border border-slate-200 bg-slate-50">
                  <img
                    src={resolveFileUrl(item.thumbnailUrl ?? item.imageUrl) ?? undefined}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <Link to={`/website-cms/gallery/${item.id}/edit`} className="font-medium text-brand-600 hover:underline">
                    {item.title || "Untitled"}
                  </Link>
                  {item.category && <span className="ml-2 text-xs text-slate-400">{item.category}</span>}
                  {item.isFeatured && <span className="ml-2 text-xs text-amber-600">Featured</span>}
                </div>
              </div>
              <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}>
                Delete
              </Button>
            </div>
          )}
        />
      )}
    </div>
  );
}
