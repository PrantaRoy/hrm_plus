import { FormEvent, useState } from "react";
import {
  CreateSaasLandingBlockInput,
  SaasLandingBlockDto,
  SaasLandingBlockType,
} from "@hrm-plus/shared";
import { Button, Field, Input, Modal, Textarea } from "@hrm-plus/ui";
import {
  createLandingBlock,
  updateLandingBlock,
  uploadLandingBlockMedia,
} from "../../../api/landing";

const TYPE_TITLE: Record<SaasLandingBlockType, string> = {
  FEATURE_HIGHLIGHT: "highlight",
  FEATURE: "feature",
  PROCESS_STEP: "step",
  STAT: "stat",
  TESTIMONIAL: "testimonial",
};

const TEXT = (v: string) => (v.trim() === "" ? null : v);

interface Props {
  blockType: SaasLandingBlockType;
  block: SaasLandingBlockDto | null;
  onClose: () => void;
  onSaved: () => void;
}

export function BlockFormModal({ blockType, block, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    title: block?.title ?? "",
    subtitle: block?.subtitle ?? "",
    body: block?.body ?? "",
    icon: block?.icon ?? "",
    bullets: (block?.bullets ?? []).join("\n"),
    ctaLabel: block?.ctaLabel ?? "",
    ctaHref: block?.ctaHref ?? "",
    stepNumber: block?.stepNumber != null ? String(block.stepNumber) : "",
    value: block?.value ?? "",
    suffix: block?.suffix ?? "",
    authorName: block?.authorName ?? "",
    authorTitle: block?.authorTitle ?? "",
    company: block?.company ?? "",
    rating: block?.rating != null ? String(block.rating) : "",
  });
  const [media, setMedia] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: CreateSaasLandingBlockInput = {
      blockType,
      title: form.title,
      subtitle: TEXT(form.subtitle),
      body: TEXT(form.body),
      icon: TEXT(form.icon),
    };
    if (blockType === "FEATURE_HIGHLIGHT") {
      payload.bullets = form.bullets
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      payload.ctaLabel = TEXT(form.ctaLabel);
      payload.ctaHref = TEXT(form.ctaHref);
    }
    if (blockType === "PROCESS_STEP") {
      payload.stepNumber = form.stepNumber ? Number(form.stepNumber) : null;
    }
    if (blockType === "STAT") {
      payload.value = TEXT(form.value);
      payload.suffix = TEXT(form.suffix);
    }
    if (blockType === "TESTIMONIAL") {
      payload.authorName = TEXT(form.authorName);
      payload.authorTitle = TEXT(form.authorTitle);
      payload.company = TEXT(form.company);
      payload.rating = form.rating ? Number(form.rating) : null;
    }

    try {
      const saved = block
        ? await updateLandingBlock(block.id, payload)
        : await createLandingBlock(payload);
      if (media) await uploadLandingBlockMedia(saved.id, media);
      onSaved();
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
          ?.message ?? "Save failed"
      );
      setSaving(false);
    }
  }

  const showIcon = blockType !== "TESTIMONIAL" && blockType !== "STAT";
  const showMedia = blockType === "FEATURE_HIGHLIGHT" || blockType === "FEATURE";

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`${block ? "Edit" : "New"} ${TYPE_TITLE[blockType]}`}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" isLoading={saving} onClick={handleSubmit}>
            Save
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <Field label={blockType === "STAT" ? "Label" : "Title"} required>
          <Input required value={form.title} onChange={(e) => set("title", e.target.value)} />
        </Field>

        <Field
          label={
            blockType === "TESTIMONIAL"
              ? "Quote"
              : blockType === "FEATURE_HIGHLIGHT"
                ? "Tagline"
                : "Subtitle"
          }
        >
          <Textarea
            rows={blockType === "TESTIMONIAL" ? 3 : 2}
            value={form.subtitle}
            onChange={(e) => set("subtitle", e.target.value)}
          />
        </Field>

        {(blockType === "FEATURE_HIGHLIGHT" || blockType === "FEATURE") && (
          <Field label="Body">
            <Textarea rows={3} value={form.body} onChange={(e) => set("body", e.target.value)} />
          </Field>
        )}

        {showIcon && (
          <Field label="Lucide icon name" helperText="e.g. Sparkles, FileCheck2, MapPinned">
            <Input value={form.icon} onChange={(e) => set("icon", e.target.value)} />
          </Field>
        )}

        {blockType === "FEATURE_HIGHLIGHT" && (
          <>
            <Field label="Bullet points" helperText="One per line">
              <Textarea rows={3} value={form.bullets} onChange={(e) => set("bullets", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="CTA label">
                <Input value={form.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} />
              </Field>
              <Field label="CTA link">
                <Input value={form.ctaHref} onChange={(e) => set("ctaHref", e.target.value)} />
              </Field>
            </div>
          </>
        )}

        {blockType === "PROCESS_STEP" && (
          <Field label="Step number">
            <Input
              type="number"
              min="1"
              value={form.stepNumber}
              onChange={(e) => set("stepNumber", e.target.value)}
            />
          </Field>
        )}

        {blockType === "STAT" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Value" required>
              <Input required value={form.value} onChange={(e) => set("value", e.target.value)} />
            </Field>
            <Field label="Suffix" helperText="e.g. +, %">
              <Input value={form.suffix} onChange={(e) => set("suffix", e.target.value)} />
            </Field>
          </div>
        )}

        {blockType === "TESTIMONIAL" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Author name">
              <Input value={form.authorName} onChange={(e) => set("authorName", e.target.value)} />
            </Field>
            <Field label="Author title">
              <Input value={form.authorTitle} onChange={(e) => set("authorTitle", e.target.value)} />
            </Field>
            <Field label="Company">
              <Input value={form.company} onChange={(e) => set("company", e.target.value)} />
            </Field>
            <Field label="Rating (1–5)">
              <Input
                type="number"
                min="1"
                max="5"
                value={form.rating}
                onChange={(e) => set("rating", e.target.value)}
              />
            </Field>
          </div>
        )}

        {showMedia && (
          <Field label="Image" helperText={block?.mediaUrl ? "An image is already set" : undefined}>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setMedia(e.target.files?.[0] ?? null)}
              className="text-sm text-slate-600"
            />
          </Field>
        )}
      </form>
    </Modal>
  );
}
