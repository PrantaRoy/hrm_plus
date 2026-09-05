import { FormEvent, useEffect, useState } from "react";
import {
  SaasFooterColumn,
  SaasLandingSectionConfig,
  SaasNavLink,
  SaasSiteSettingsDto,
  SaasSocialLink,
  UpdateSaasSiteSettingsInput,
} from "@hrm-plus/shared";
import { Button, Card, Checkbox, Field, Input, PageHeader, Spinner, Textarea } from "@hrm-plus/ui";
import {
  getLandingSettings,
  LandingImageField,
  updateLandingSettings,
  uploadLandingImage,
} from "../../../api/landing";
import { resolveFileUrl } from "../../../utils/fileUrl";
import { RepeaterList } from "./repeater";

type FormState = SaasSiteSettingsDto;

const TEXT = (v: string) => (v.trim() === "" ? null : v);

export default function LandingSettings() {
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    getLandingSettings().then(setForm).catch(() => setMessage({ kind: "error", text: "Failed to load settings" }));
  }, []);

  function patch(next: Partial<FormState>) {
    setForm((f) => (f ? { ...f, ...next } : f));
  }

  async function handleImage(field: LandingImageField, file: File | undefined) {
    if (!file) return;
    try {
      const updated = await uploadLandingImage(field, file);
      setForm(updated);
      setMessage({ kind: "ok", text: "Image uploaded" });
    } catch {
      setMessage({ kind: "error", text: "Image upload failed" });
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setMessage(null);
    const payload: UpdateSaasSiteSettingsInput = {
      siteName: form.siteName,
      navLinks: form.navLinks,
      headerCtaLabel: form.headerCtaLabel,
      headerCtaHref: form.headerCtaHref,
      loginUrl: form.loginUrl,
      heroEyebrow: form.heroEyebrow,
      heroHeadline: form.heroHeadline,
      heroSubheadline: form.heroSubheadline,
      heroPrimaryCtaLabel: form.heroPrimaryCtaLabel,
      heroPrimaryCtaHref: form.heroPrimaryCtaHref,
      heroSecondaryCtaLabel: form.heroSecondaryCtaLabel,
      heroSecondaryCtaHref: form.heroSecondaryCtaHref,
      sections: form.sections,
      ctaHeading: form.ctaHeading,
      ctaSubheading: form.ctaSubheading,
      ctaButtonLabel: form.ctaButtonLabel,
      ctaButtonHref: form.ctaButtonHref,
      contactHeading: form.contactHeading,
      contactSubheading: form.contactSubheading,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      contactAddress: form.contactAddress,
      footerTagline: form.footerTagline,
      footerColumns: form.footerColumns,
      socialLinks: form.socialLinks,
      footerLegalText: form.footerLegalText,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
    };
    try {
      const updated = await updateLandingSettings(payload);
      setForm(updated);
      setMessage({ kind: "ok", text: "Saved. Changes appear on the site within a minute." });
    } catch (err) {
      const text =
        (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
          ?.message ?? "Save failed";
      setMessage({ kind: "error", text });
    } finally {
      setSaving(false);
    }
  }

  if (!form) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-16">
      <PageHeader
        title="Landing Content"
        description="Edit the copy, navigation and branding of the public marketing page."
        actions={
          <Button type="submit" size="sm" isLoading={saving}>
            Save changes
          </Button>
        }
      />

      {message && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            message.kind === "ok"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <Card title="Brand & navigation">
        <div className="space-y-4">
          <Field label="Site name">
            <Input value={form.siteName} onChange={(e) => patch({ siteName: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUpload
              label="Logo"
              url={resolveFileUrl(form.logoUrl)}
              onSelect={(file) => handleImage("logo", file)}
            />
            <ImageUpload
              label="Favicon"
              url={resolveFileUrl(form.faviconUrl)}
              onSelect={(file) => handleImage("favicon", file)}
            />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Navigation links</p>
            <RepeaterList<SaasNavLink>
              items={form.navLinks}
              onChange={(navLinks) => patch({ navLinks })}
              makeEmpty={() => ({ label: "", href: "" })}
              addLabel="Add link"
              renderRow={(item, update) => (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Label"
                    value={item.label}
                    onChange={(e) => update({ label: e.target.value })}
                  />
                  <Input
                    placeholder="#pricing or /blog"
                    value={item.href}
                    onChange={(e) => update({ href: e.target.value })}
                  />
                </div>
              )}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Header button label">
              <Input
                value={form.headerCtaLabel}
                onChange={(e) => patch({ headerCtaLabel: e.target.value })}
              />
            </Field>
            <Field label="Header button link">
              <Input
                value={form.headerCtaHref}
                onChange={(e) => patch({ headerCtaHref: e.target.value })}
              />
            </Field>
            <Field label="Super-admin login URL">
              <Input value={form.loginUrl} onChange={(e) => patch({ loginUrl: e.target.value })} />
            </Field>
          </div>
        </div>
      </Card>

      <Card title="Hero">
        <div className="space-y-4">
          <Field label="Eyebrow">
            <Input
              value={form.heroEyebrow ?? ""}
              onChange={(e) => patch({ heroEyebrow: TEXT(e.target.value) })}
            />
          </Field>
          <Field label="Headline">
            <Input value={form.heroHeadline} onChange={(e) => patch({ heroHeadline: e.target.value })} />
          </Field>
          <Field label="Subheadline">
            <Textarea
              rows={2}
              value={form.heroSubheadline ?? ""}
              onChange={(e) => patch({ heroSubheadline: TEXT(e.target.value) })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary CTA label">
              <Input
                value={form.heroPrimaryCtaLabel ?? ""}
                onChange={(e) => patch({ heroPrimaryCtaLabel: TEXT(e.target.value) })}
              />
            </Field>
            <Field label="Primary CTA link">
              <Input
                value={form.heroPrimaryCtaHref ?? ""}
                onChange={(e) => patch({ heroPrimaryCtaHref: TEXT(e.target.value) })}
              />
            </Field>
            <Field label="Secondary CTA label">
              <Input
                value={form.heroSecondaryCtaLabel ?? ""}
                onChange={(e) => patch({ heroSecondaryCtaLabel: TEXT(e.target.value) })}
              />
            </Field>
            <Field label="Secondary CTA link">
              <Input
                value={form.heroSecondaryCtaHref ?? ""}
                onChange={(e) => patch({ heroSecondaryCtaHref: TEXT(e.target.value) })}
              />
            </Field>
          </div>
          <ImageUpload
            label="Hero image (optional — a placeholder graphic shows if empty)"
            url={resolveFileUrl(form.heroImageUrl)}
            onSelect={(file) => handleImage("heroImage", file)}
          />
        </div>
      </Card>

      <Card title="Sections" description="Headings, visibility and order of each landing section.">
        <RepeaterList<SaasLandingSectionConfig>
          items={form.sections}
          onChange={(sections) => patch({ sections: sections.map((s, i) => ({ ...s, order: i })) })}
          makeEmpty={() => ({
            key: "",
            label: "",
            heading: null,
            subheading: null,
            enabled: true,
            order: form.sections.length,
          })}
          addLabel="Add section"
          renderRow={(item, update) => (
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="key (e.g. pricing)"
                  value={item.key}
                  onChange={(e) => update({ key: e.target.value })}
                />
                <Input
                  placeholder="Label"
                  value={item.label}
                  onChange={(e) => update({ label: e.target.value })}
                />
              </div>
              <Input
                placeholder="Heading"
                value={item.heading ?? ""}
                onChange={(e) => update({ heading: TEXT(e.target.value) })}
              />
              <Input
                placeholder="Subheading"
                value={item.subheading ?? ""}
                onChange={(e) => update({ subheading: TEXT(e.target.value) })}
              />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <Checkbox
                  checked={item.enabled}
                  onChange={(e) => update({ enabled: e.target.checked })}
                />
                Visible on the landing page
              </label>
            </div>
          )}
        />
      </Card>

      <Card title="Call-to-action band">
        <div className="space-y-4">
          <Field label="Heading">
            <Input
              value={form.ctaHeading ?? ""}
              onChange={(e) => patch({ ctaHeading: TEXT(e.target.value) })}
            />
          </Field>
          <Field label="Subheading">
            <Textarea
              rows={2}
              value={form.ctaSubheading ?? ""}
              onChange={(e) => patch({ ctaSubheading: TEXT(e.target.value) })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Button label">
              <Input
                value={form.ctaButtonLabel ?? ""}
                onChange={(e) => patch({ ctaButtonLabel: TEXT(e.target.value) })}
              />
            </Field>
            <Field label="Button link">
              <Input
                value={form.ctaButtonHref ?? ""}
                onChange={(e) => patch({ ctaButtonHref: TEXT(e.target.value) })}
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card title="Contact">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Heading">
              <Input
                value={form.contactHeading ?? ""}
                onChange={(e) => patch({ contactHeading: TEXT(e.target.value) })}
              />
            </Field>
            <Field label="Contact email">
              <Input
                type="email"
                value={form.contactEmail ?? ""}
                onChange={(e) => patch({ contactEmail: TEXT(e.target.value) })}
              />
            </Field>
            <Field label="Contact phone">
              <Input
                value={form.contactPhone ?? ""}
                onChange={(e) => patch({ contactPhone: TEXT(e.target.value) })}
              />
            </Field>
          </div>
          <Field label="Subheading">
            <Textarea
              rows={2}
              value={form.contactSubheading ?? ""}
              onChange={(e) => patch({ contactSubheading: TEXT(e.target.value) })}
            />
          </Field>
          <Field label="Address">
            <Textarea
              rows={2}
              value={form.contactAddress ?? ""}
              onChange={(e) => patch({ contactAddress: TEXT(e.target.value) })}
            />
          </Field>
        </div>
      </Card>

      <Card title="Footer">
        <div className="space-y-4">
          <Field label="Tagline">
            <Textarea
              rows={2}
              value={form.footerTagline ?? ""}
              onChange={(e) => patch({ footerTagline: TEXT(e.target.value) })}
            />
          </Field>
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Footer columns</p>
            <RepeaterList<SaasFooterColumn>
              items={form.footerColumns}
              onChange={(footerColumns) => patch({ footerColumns })}
              makeEmpty={() => ({ title: "", links: [] })}
              addLabel="Add column"
              renderRow={(item, update) => (
                <div className="space-y-2">
                  <Input
                    placeholder="Column title"
                    value={item.title}
                    onChange={(e) => update({ title: e.target.value })}
                  />
                  <RepeaterList<SaasNavLink>
                    items={item.links}
                    onChange={(links) => update({ links })}
                    makeEmpty={() => ({ label: "", href: "" })}
                    addLabel="Add link"
                    reorderable={false}
                    renderRow={(link, updateLink) => (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          placeholder="Label"
                          value={link.label}
                          onChange={(e) => updateLink({ label: e.target.value })}
                        />
                        <Input
                          placeholder="URL"
                          value={link.href}
                          onChange={(e) => updateLink({ href: e.target.value })}
                        />
                      </div>
                    )}
                  />
                </div>
              )}
            />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Social links</p>
            <RepeaterList<SaasSocialLink>
              items={form.socialLinks}
              onChange={(socialLinks) => patch({ socialLinks })}
              makeEmpty={() => ({ platform: "", icon: "", url: "" })}
              addLabel="Add social link"
              renderRow={(item, update) => (
                <div className="grid gap-2 sm:grid-cols-3">
                  <Input
                    placeholder="Platform"
                    value={item.platform}
                    onChange={(e) => update({ platform: e.target.value })}
                  />
                  <Input
                    placeholder="lucide icon (e.g. Linkedin)"
                    value={item.icon}
                    onChange={(e) => update({ icon: e.target.value })}
                  />
                  <Input
                    placeholder="https://…"
                    value={item.url}
                    onChange={(e) => update({ url: e.target.value })}
                  />
                </div>
              )}
            />
          </div>
          <Field label="Legal text">
            <Input
              value={form.footerLegalText ?? ""}
              onChange={(e) => patch({ footerLegalText: TEXT(e.target.value) })}
            />
          </Field>
        </div>
      </Card>

      <Card title="SEO">
        <div className="space-y-4">
          <Field label="Meta title">
            <Input
              value={form.metaTitle ?? ""}
              onChange={(e) => patch({ metaTitle: TEXT(e.target.value) })}
            />
          </Field>
          <Field label="Meta description">
            <Textarea
              rows={2}
              value={form.metaDescription ?? ""}
              onChange={(e) => patch({ metaDescription: TEXT(e.target.value) })}
            />
          </Field>
        </div>
      </Card>

      <div>
        <Button type="submit" isLoading={saving}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

function ImageUpload({
  label,
  url,
  onSelect,
}: {
  label: string;
  url: string | null;
  onSelect: (file: File | undefined) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        {url && (
          <img
            src={url}
            alt=""
            className="h-12 w-12 rounded border border-slate-200 object-contain p-1"
          />
        )}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={(e) => onSelect(e.target.files?.[0])}
          className="text-sm text-slate-600"
        />
      </div>
    </Field>
  );
}
