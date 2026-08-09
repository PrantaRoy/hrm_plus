import { FormEvent, useEffect, useState } from "react";
import { SocialLinkDto } from "@hrm-plus/shared";
import { Button, Field, Input, PageHeader, Spinner } from "@hrm-plus/ui";
import {
  createSocialLink,
  deleteSocialLink,
  listSocialLinks,
  reorderSocialLinks,
  updateSocialLink,
} from "../../api/socialLinks";
import { SortableList } from "../../components/SortableList";

export default function SocialLinkList() {
  const [links, setLinks] = useState<SocialLinkDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [platform, setPlatform] = useState("");
  const [icon, setIcon] = useState("");
  const [url, setUrl] = useState("");

  function refresh() {
    setLoading(true);
    listSocialLinks()
      .then(setLinks)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load social links"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createSocialLink({ platform, icon, url });
      setPlatform("");
      setIcon("");
      setUrl("");
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to create social link");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(link: SocialLinkDto) {
    setError(null);
    try {
      await updateSocialLink(link.id, { isActive: !link.isActive });
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to update social link");
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this social link?")) return;
    setError(null);
    try {
      await deleteSocialLink(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to delete social link");
    }
  }

  async function handleReorder(orderedIds: number[]) {
    setError(null);
    const previous = links;
    const byId = new Map(links.map((l) => [l.id, l]));
    setLinks(orderedIds.map((id) => byId.get(id)!).filter(Boolean));
    try {
      await reorderSocialLinks(orderedIds);
    } catch (err: any) {
      setLinks(previous);
      setError(err.response?.data?.error?.message ?? "Failed to reorder social links");
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader title="Social Links" description="Icons shown in the public website footer." />

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      <form onSubmit={handleCreate} className="grid grid-cols-4 gap-3 items-end rounded-md border border-slate-200 p-4">
        <Field label="Platform" required>
          <Input required value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="LinkedIn" />
        </Field>
        <Field label="Icon" required helperText="lucide-react icon name">
          <Input required value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Linkedin" />
        </Field>
        <Field label="URL" required>
          <Input required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://linkedin.com/company/..." />
        </Field>
        <Button type="submit" isLoading={submitting}>
          Add
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <SortableList
          items={links}
          onReorder={handleReorder}
          renderItem={(link) => (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-slate-800">{link.platform}</span>
                <span className="ml-2 text-xs text-slate-400">{link.url}</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={link.isActive} onChange={() => handleToggle(link)} />
                  Active
                </label>
                <Button size="sm" variant="danger" onClick={() => handleDelete(link.id)}>
                  Delete
                </Button>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}
