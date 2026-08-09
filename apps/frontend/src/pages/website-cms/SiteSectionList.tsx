import { useEffect, useState } from "react";
import { SiteSectionDto } from "@hrm-plus/shared";
import { PageHeader, Spinner } from "@hrm-plus/ui";
import { listSiteSections, reorderSiteSections, updateSiteSection } from "../../api/siteSections";
import { SortableList } from "../../components/SortableList";

export default function SiteSectionList() {
  const [sections, setSections] = useState<SiteSectionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    listSiteSections()
      .then(setSections)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load sections"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleToggle(section: SiteSectionDto) {
    setError(null);
    const previous = sections;
    setSections((list) => list.map((s) => (s.id === section.id ? { ...s, isEnabled: !s.isEnabled } : s)));
    try {
      await updateSiteSection(section.id, { isEnabled: !section.isEnabled });
    } catch (err: any) {
      setSections(previous);
      setError(err.response?.data?.error?.message ?? "Failed to update section");
    }
  }

  async function handleReorder(orderedIds: number[]) {
    setError(null);
    const previous = sections;
    const byId = new Map(sections.map((s) => [s.id, s]));
    setSections(orderedIds.map((id) => byId.get(id)!).filter(Boolean));
    try {
      await reorderSiteSections(orderedIds);
    } catch (err: any) {
      setSections(previous);
      setError(err.response?.data?.error?.message ?? "Failed to reorder sections");
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader
        title="Website Sections"
        description="Toggle visibility and drag to reorder the sections of the public website."
      />

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <SortableList
          items={sections}
          onReorder={handleReorder}
          renderItem={(section) => (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">{section.displayName}</span>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={section.isEnabled} onChange={() => handleToggle(section)} />
                Enabled
              </label>
            </div>
          )}
        />
      )}
    </div>
  );
}
