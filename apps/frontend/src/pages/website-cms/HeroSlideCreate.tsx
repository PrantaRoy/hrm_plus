import { ChangeEvent, FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HERO_MEDIA_TYPES } from "@hrm-plus/shared";
import { Button, Card, Field, Input, PageHeader, Select } from "@hrm-plus/ui";
import { createHeroSlide } from "../../api/heroSlides";

export default function HeroSlideCreate() {
  const navigate = useNavigate();
  const [headline, setHeadline] = useState("");
  const [subHeadline, setSubHeadline] = useState("");
  const [mediaType, setMediaType] = useState<(typeof HERO_MEDIA_TYPES)[number]>("IMAGE");
  const [media, setMedia] = useState<File | null>(null);
  const [ctaPrimaryText, setCtaPrimaryText] = useState("");
  const [ctaPrimaryUrl, setCtaPrimaryUrl] = useState("");
  const [ctaSecondaryText, setCtaSecondaryText] = useState("");
  const [ctaSecondaryUrl, setCtaSecondaryUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleMediaChange(e: ChangeEvent<HTMLInputElement>) {
    setMedia(e.target.files?.[0] ?? null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!media) {
      setError("Media file is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createHeroSlide(
        {
          headline,
          subHeadline: subHeadline || undefined,
          mediaType,
          ctaPrimaryText: ctaPrimaryText || undefined,
          ctaPrimaryUrl: ctaPrimaryUrl || undefined,
          ctaSecondaryText: ctaSecondaryText || undefined,
          ctaSecondaryUrl: ctaSecondaryUrl || undefined,
        },
        media
      );
      navigate("/website-cms/hero-slides");
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to create hero slide");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader title="New Hero Slide" />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

          <Field label="Headline" required>
            <Input required value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </Field>

          <Field label="Sub-headline">
            <Input value={subHeadline} onChange={(e) => setSubHeadline(e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Media type" required>
              <Select value={mediaType} onChange={(e) => setMediaType(e.target.value as typeof mediaType)}>
                {HERO_MEDIA_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Media file" required>
              <input
                type="file"
                required
                accept={mediaType === "IMAGE" ? "image/png,image/jpeg,image/webp" : "video/mp4,video/webm"}
                onChange={handleMediaChange}
                className="block w-full text-sm text-slate-600"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Primary CTA text">
              <Input value={ctaPrimaryText} onChange={(e) => setCtaPrimaryText(e.target.value)} />
            </Field>
            <Field label="Primary CTA URL">
              <Input value={ctaPrimaryUrl} onChange={(e) => setCtaPrimaryUrl(e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Secondary CTA text">
              <Input value={ctaSecondaryText} onChange={(e) => setCtaSecondaryText(e.target.value)} />
            </Field>
            <Field label="Secondary CTA URL">
              <Input value={ctaSecondaryUrl} onChange={(e) => setCtaSecondaryUrl(e.target.value)} />
            </Field>
          </div>

          <Button type="submit" isLoading={submitting}>
            Create Slide
          </Button>
        </form>
      </Card>
    </div>
  );
}
