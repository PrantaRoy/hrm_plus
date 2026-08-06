import { ChangeEvent, useEffect, useState } from "react";
import { DATE_FORMATS, DateFormat, TIME_FORMATS, TimeFormat } from "@hrm-plus/shared";
import { Button, Card, Field, Input, Select, Spinner } from "@hrm-plus/ui";
import {
  getGeneralSettings,
  updateGeneralSettings,
  uploadGeneralFavicon,
  uploadGeneralLogo,
} from "../../api/generalSettings";
import { resolveFileUrl } from "../../utils/fileUrl";

const CURRENCIES = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "NZD", label: "NZD — New Zealand Dollar" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "INR", label: "INR — Indian Rupee" },
  { code: "JPY", label: "JPY — Japanese Yen" },
  { code: "CNY", label: "CNY — Chinese Yuan" },
  { code: "SGD", label: "SGD — Singapore Dollar" },
  { code: "AED", label: "AED — UAE Dirham" },
  { code: "ZAR", label: "ZAR — South African Rand" },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "hi", label: "Hindi" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ar", label: "Arabic" },
];

function listTimezones(): string[] {
  const supportedValuesOf = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] })
    .supportedValuesOf;
  if (typeof supportedValuesOf === "function") {
    try {
      return supportedValuesOf("timeZone");
    } catch {
      // fall through to the curated list below
    }
  }
  return [
    "UTC",
    "Pacific/Auckland",
    "Australia/Sydney",
    "Asia/Kolkata",
    "Asia/Dubai",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "America/New_York",
    "America/Chicago",
    "America/Los_Angeles",
    "America/Toronto",
  ];
}

const TIMEZONES = listTimezones();

const emptyForm = {
  siteTitle: "",
  dateFormat: "DD/MM/YYYY" as DateFormat,
  timeFormat: "24h" as TimeFormat,
  timezone: "UTC",
  currency: "USD",
  language: "en",
  copyrightText: "",
};

export default function GeneralSettings() {
  const [form, setForm] = useState(emptyForm);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getGeneralSettings()
      .then((settings) => {
        setForm({
          siteTitle: settings.siteTitle,
          dateFormat: settings.dateFormat,
          timeFormat: settings.timeFormat,
          timezone: settings.timezone,
          currency: settings.currency,
          language: settings.language,
          copyrightText: settings.copyrightText ?? "",
        });
        setLogoUrl(settings.logoUrl);
        setFaviconUrl(settings.faviconUrl);
      })
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load general settings"))
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateGeneralSettings({
        siteTitle: form.siteTitle,
        dateFormat: form.dateFormat,
        timeFormat: form.timeFormat,
        timezone: form.timezone,
        currency: form.currency,
        language: form.language,
        copyrightText: form.copyrightText || null,
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to save general settings");
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
      const updated = await uploadGeneralLogo(file);
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
      const updated = await uploadGeneralFavicon(file);
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
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}
      {saved && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          General settings saved.
        </div>
      )}

      <Card title="Branding" description="Shown across the sidebar, browser tab, and generated documents.">
        <div className="space-y-4">
          <Field label="Site title" required>
            <Input value={form.siteTitle} onChange={(e) => set("siteTitle", e.target.value)} />
          </Field>
          <Field label="Copyright text">
            <Input
              value={form.copyrightText}
              onChange={(e) => set("copyrightText", e.target.value)}
              placeholder="© 2026 Acme Ltd. All rights reserved."
            />
          </Field>

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
                    <img
                      src={resolveFileUrl(faviconUrl) ?? undefined}
                      alt="Favicon"
                      className="h-8 w-8 object-contain"
                    />
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
                    accept="image/png,image/webp,image/svg+xml,image/x-icon"
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

      <Card title="Localization" description="Formatting defaults applied across the workspace.">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Date format">
              <Select value={form.dateFormat} onChange={(e) => set("dateFormat", e.target.value as DateFormat)}>
                {DATE_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Time format">
              <Select value={form.timeFormat} onChange={(e) => set("timeFormat", e.target.value as TimeFormat)}>
                {TIME_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f === "12h" ? "12-hour (2:30 PM)" : "24-hour (14:30)"}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Timezone">
              <Select value={form.timezone} onChange={(e) => set("timezone", e.target.value)}>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Currency">
              <Select value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Language">
            <Select value={form.language} onChange={(e) => set("language", e.target.value)} className="sm:w-64">
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </Select>
          </Field>

          <Button onClick={handleSave} isLoading={saving}>
            Save
          </Button>
        </div>
      </Card>
    </div>
  );
}
