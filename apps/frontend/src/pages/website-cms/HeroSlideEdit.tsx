import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { HERO_MEDIA_TYPES } from "@hrm-plus/shared";
import { Button, Card, Field, Input, PageHeader, Select, Spinner } from "@hrm-plus/ui";
import { getHeroSlide, updateHeroSlide } from "../../api/heroSlides";
import { resolveFileUrl } from "../../utils/fileUrl";

export default function HeroSlideEdit() {
  const { id } = useParams();
  const slideId = Number(id);

  const [headline, setHeadline] = useState("");
  const [subHeadline, setSubHeadline] = useState("");
  const [mediaType, setMediaType] = useState<(typeof HERO_MEDIA_TYPES)[number]>("IMAGE");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [media, setMedia] = useState<File | null>(null);
  const [ctaPrimaryText, setCtaPrimaryText] = useState("");
  const [ctaPrimaryUrl, setCtaPrimaryUrl] = useState("");
  const [ctaSecondaryText, setCtaSecondaryText] = useState("");
  const [ctaSecondaryUrl, setCtaSecondaryUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    getHeroSlide(slideId)
      .then((slide) => {
        setHeadline(slide.headline);
        setSubHeadline(slide.subHeadline ?? "");
        setMediaType(slide.mediaType);
        setMediaUrl(slide.mediaUrl);
        setCtaPrimaryText(slide.ctaPrimaryText ?? "");
        setCtaPrimaryUrl(slide.ctaPrimaryUrl ?? "");
        setCtaSecondaryText(slide.ctaSecondaryText ?? "");
        setCtaSecondaryUrl(slide.ctaSecondaryUrl ?? "");
        setIsActive(slide.isActive);
      })
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load hero slide"))
      .finally(() => setLoading(false));
  }, [slideId]);

  function handleMediaChange(e: ChangeEvent<HTMLInputElement>) {
    setMedia(e.target.files?.[0] ?? null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const updated = await updateHeroSlide(
        slideId,
        {
          headline,
          subHeadline: subHeadline || undefined,
          mediaType,
          ctaPrimaryText: ctaPrimaryText || undefined,
          ctaPrimaryUrl: ctaPrimaryUrl || undefined,
          ctaSecondaryText: ctaSecondaryText || undefined,
          ctaSecondaryUrl: ctaSecondaryUrl || undefined,
          isActive,
        },
        media ?? undefined
      );
      setMediaUrl(updated.mediaUrl);
      setMedia(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to update hero slide");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader
        title={headline}
        description={
          <Link to="/website-cms/hero-slides" className="text-brand-600 hover:underline">
            Back to hero slides
          </Link>
        }
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

          <Field label="Headline" required>
            <Input required value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </Field>

          <Field label="Sub-headline">
            <Input value={subHeadline} onChange={(e) => setSubHeadline(e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3 items-start">
            <Field label="Media type" required>
              <Select value={mediaType} onChange={(e) => setMediaType(e.target.value as typeof mediaType)}>
                {HERO_MEDIA_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Replace media" helperText="Leave empty to keep the current media">
              {mediaUrl && (
                <div className="mb-2 h-16 w-28 overflow-hidden rounded border border-slate-200 bg-slate-50">
                  {mediaType === "IMAGE" ? (
                    <img src={resolveFileUrl(mediaUrl) ?? undefined} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-[10px] text-slate-400">Video</span>
                  )}
                </div>
              )}
              <input
                type="file"
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

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active (visible on the public website)
          </label>

          <Button type="submit" isLoading={submitting}>
            Save Changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
