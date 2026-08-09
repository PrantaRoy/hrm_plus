import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeroSlideDto } from "@hrm-plus/shared";
import { Button, PageHeader, Spinner } from "@hrm-plus/ui";
import { deleteHeroSlide, listHeroSlides, reorderHeroSlides } from "../../api/heroSlides";
import { SortableList } from "../../components/SortableList";
import { resolveFileUrl } from "../../utils/fileUrl";

export default function HeroSlideList() {
  const [slides, setSlides] = useState<HeroSlideDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    listHeroSlides()
      .then(setSlides)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load hero slides"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this hero slide?")) return;
    setError(null);
    try {
      await deleteHeroSlide(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to delete hero slide");
    }
  }

  async function handleReorder(orderedIds: number[]) {
    setError(null);
    const previous = slides;
    const byId = new Map(slides.map((s) => [s.id, s]));
    setSlides(orderedIds.map((id) => byId.get(id)!).filter(Boolean));
    try {
      await reorderHeroSlides(orderedIds);
    } catch (err: any) {
      setSlides(previous);
      setError(err.response?.data?.error?.message ?? "Failed to reorder hero slides");
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader
        title="Hero Slides"
        description="Drag to reorder. Shown in the public website's Hero section."
        actions={
          <Link
            to="/website-cms/hero-slides/new"
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            New Slide
          </Link>
        }
      />

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : slides.length === 0 ? (
        <p className="text-sm text-slate-500">No hero slides yet.</p>
      ) : (
        <SortableList
          items={slides}
          onReorder={handleReorder}
          renderItem={(slide) => (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-16 overflow-hidden rounded border border-slate-200 bg-slate-50">
                  {slide.mediaType === "IMAGE" ? (
                    <img src={resolveFileUrl(slide.mediaUrl) ?? undefined} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-[10px] text-slate-400">Video</span>
                  )}
                </div>
                <div>
                  <Link to={`/website-cms/hero-slides/${slide.id}/edit`} className="font-medium text-brand-600 hover:underline">
                    {slide.headline}
                  </Link>
                  <span className="ml-2 text-xs text-slate-400">{slide.isActive ? "Active" : "Inactive"}</span>
                </div>
              </div>
              <Button size="sm" variant="danger" onClick={() => handleDelete(slide.id)}>
                Delete
              </Button>
            </div>
          )}
        />
      )}
    </div>
  );
}
