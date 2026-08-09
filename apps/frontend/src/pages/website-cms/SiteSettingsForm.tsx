import { ChangeEvent, useEffect, useState } from "react";
import { BusinessHourEntry } from "@hrm-plus/shared";
import { Button, Card, Field, Input, PageHeader, Spinner, Textarea } from "@hrm-plus/ui";
import { getSiteSettings, updateSiteSettings, uploadSiteFavicon, uploadSiteLogo } from "../../api/siteSettings";
import { resolveFileUrl } from "../../utils/fileUrl";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const emptyForm = {
  siteTitle: "",
  tagline: "",
  primaryColor: "#4F46E5",
  secondaryColor: "#0EA5E9",
  contactEmail: "",
  contactPhone: "",
  contactAddress: "",
  aboutHeading: "",
  aboutContent: "",
  metaDescription: "",
};

export default function SiteSettingsForm() {
  const [form, setForm] = useState(emptyForm);
  const [businessHours, setBusinessHours] = useState<BusinessHourEntry[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSiteSettings()
      .then((settings) => {
        setForm({
          siteTitle: settings.siteTitle,
          tagline: settings.tagline ?? "",
          primaryColor: settings.primaryColor,
          secondaryColor: settings.secondaryColor,
          contactEmail: settings.contactEmail ?? "",
          contactPhone: settings.contactPhone ?? "",
          contactAddress: settings.contactAddress ?? "",
          aboutHeading: settings.aboutHeading ?? "",
          aboutContent: settings.aboutContent ?? "",
          metaDescription: settings.metaDescription ?? "",
        });
        setBusinessHours(
          settings.businessHours ?? WEEKDAYS.map((day) => ({ day, openTime: "09:00", closeTime: "17:00", isClosed: day === "Sunday" }))
        );
        setLogoUrl(settings.logoUrl);
        setFaviconUrl(settings.faviconUrl);
      })
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load site settings"))
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setHour(index: number, patch: Partial<BusinessHourEntry>) {
    setBusinessHours((hours) => hours.map((h, i) => (i === index ? { ...h, ...patch } : h)));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateSiteSettings({
        siteTitle: form.siteTitle,
        tagline: form.tagline || null,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        contactEmail: form.contactEmail || null,
        contactPhone: form.contactPhone || null,
        contactAddress: form.contactAddress || null,
        businessHours,
        aboutHeading: form.aboutHeading || null,
        aboutContent: form.aboutContent || null,
        metaDescription: form.metaDescription || null,
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to save site settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setError(null);
    try {
      const updated = await uploadSiteLogo(file);
      setLogoUrl(updated.logoUrl);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  }

  async function handleFaviconChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFavicon(true);
    setError(null);
    try {
      const updated = await uploadSiteFavicon(file);
      setFaviconUrl(updated.faviconUrl);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to upload favicon");
    } finally {
      setUploadingFavicon(false);
      e.target.value = "";
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader title="Site Settings" description="Branding, contact info, and about content for the public website." />

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}
      {saved && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          Site settings saved.
        </div>
      )}

      <Card title="Branding" description="Shown on the public marketing website.">
        <div className="space-y-4">
          <Field label="Site title" required>
            <Input value={form.siteTitle} onChange={(e) => set("siteTitle", e.target.value)} />
          </Field>
          <Field label="Tagline">
            <Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="A short tagline" />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Primary color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => set("primaryColor", e.target.value)}
                  className="h-9 w-12 rounded border border-slate-300"
                />
                <Input value={form.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} />
              </div>
            </Field>
            <Field label="Secondary color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.secondaryColor}
                  onChange={(e) => set("secondaryColor", e.target.value)}
                  className="h-9 w-12 rounded border border-slate-300"
                />
                <Input value={form.secondaryColor} onChange={(e) => set("secondaryColor", e.target.value)} />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Logo</p>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-md border border-slate-200 bg-slate-50 overflow-hidden">
                  {logoUrl ? (
                    <img src={resolveFileUrl(logoUrl) ?? undefined} alt="Logo" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-xs text-slate-400">None</span>
                  )}
                </div>
                <label>
                  <span className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                    {uploadingLogo ? "Uploading..." : "Change logo"}
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    disabled={uploadingLogo}
                    onChange={handleLogoChange}
                  />
                </label>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Favicon</p>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-md border border-slate-200 bg-slate-50 overflow-hidden">
                  {faviconUrl ? (
                    <img src={resolveFileUrl(faviconUrl) ?? undefined} alt="Favicon" className="h-8 w-8 object-contain" />
                  ) : (
                    <span className="text-xs text-slate-400">None</span>
                  )}
                </div>
                <label>
                  <span className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                    {uploadingFavicon ? "Uploading..." : "Change favicon"}
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/webp,image/x-icon"
                    className="hidden"
                    disabled={uploadingFavicon}
                    onChange={handleFaviconChange}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Contact" description="Shown in the site footer and contact section.">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Contact email">
              <Input type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
            </Field>
            <Field label="Contact phone">
              <Input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
            </Field>
          </div>
          <Field label="Address">
            <Textarea rows={2} value={form.contactAddress} onChange={(e) => set("contactAddress", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title="Business hours">
        <div className="space-y-2">
          {businessHours.map((hour, index) => (
            <div key={hour.day} className="grid grid-cols-4 items-center gap-3 text-sm">
              <span className="text-slate-700">{hour.day}</span>
              <label className="flex items-center gap-1.5 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={!hour.isClosed}
                  onChange={(e) => setHour(index, { isClosed: !e.target.checked })}
                />
                Open
              </label>
              <Input
                type="time"
                disabled={hour.isClosed}
                value={hour.openTime}
                onChange={(e) => setHour(index, { openTime: e.target.value })}
              />
              <Input
                type="time"
                disabled={hour.isClosed}
                value={hour.closeTime}
                onChange={(e) => setHour(index, { closeTime: e.target.value })}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card title="About section">
        <div className="space-y-4">
          <Field label="Heading">
            <Input value={form.aboutHeading} onChange={(e) => set("aboutHeading", e.target.value)} />
          </Field>
          <Field label="Content">
            <Textarea rows={6} value={form.aboutContent} onChange={(e) => set("aboutContent", e.target.value)} />
          </Field>
          <Field label="Meta description" helperText="Used for search engine previews">
            <Textarea rows={2} value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Button onClick={handleSave} isLoading={saving}>
        Save
      </Button>
    </div>
  );
}
