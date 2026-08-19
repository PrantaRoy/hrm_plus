import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PlayCircle } from "lucide-react";
import { PublicHeroSlideDto } from "@hrm-plus/shared";
import { resolveFileUrl } from "../../utils/fileUrl";
import { BlobShape } from "./decor/BlobShape";
import { SquiggleArrow } from "./decor/SquiggleArrow";
import { PillBadge } from "./decor/PillBadge";
import { PILL_BUTTON_PRIMARY } from "./decor/publicSiteClasses";

function splitLastWord(text: string): [string, string] {
  const idx = text.lastIndexOf(" ");
  if (idx === -1) return ["", text];
  return [text.slice(0, idx + 1), text.slice(idx + 1)];
}

export function HeroSection({ data }: { data: PublicHeroSlideDto[] }) {
  const [index, setIndex] = useState(0);
  const slide = data[index];

  useEffect(() => {
    if (data.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % data.length), 6000);
    return () => clearInterval(timer);
  }, [data.length]);

  if (!slide) return null;

  const [headlineLead, headlineLast] = splitLastWord(slide.headline);

  return (
    <section id="hero" className="relative overflow-hidden bg-[var(--brand-primary-tint)]">
      <BlobShape tone="primary" className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 opacity-20" />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <PillBadge>Built for growing teams</PillBadge>

          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                {headlineLead}
                <span className="underline decoration-[var(--brand-primary)] decoration-4 underline-offset-4">
                  {headlineLast}
                </span>
              </h1>
              {slide.subHeadline && <p className="mt-5 max-w-md text-base text-slate-600">{slide.subHeadline}</p>}

              <div className="mt-8 flex flex-wrap items-center gap-6">
                {slide.ctaPrimaryText && slide.ctaPrimaryUrl && (
                  <a href={slide.ctaPrimaryUrl} className={PILL_BUTTON_PRIMARY}>
                    {slide.ctaPrimaryText}
                  </a>
                )}
                {slide.ctaSecondaryText && slide.ctaSecondaryUrl && (
                  <a
                    href={slide.ctaSecondaryUrl}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-[var(--brand-primary)]"
                  >
                    <PlayCircle size={20} />
                    {slide.ctaSecondaryText}
                  </a>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {data.length > 1 && (
            <div className="mt-10 flex gap-2">
              {data.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setIndex(i)}
                  className={`h-2 w-2 rounded-full transition ${
                    i === index ? "bg-[var(--brand-primary)]" : "bg-[var(--brand-primary)]/30"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </motion.div>

        <div className="relative">
          <BlobShape tone="secondary" className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 opacity-60" />
          <BlobShape tone="primary" className="pointer-events-none absolute -bottom-12 -right-8 h-48 w-48 opacity-40" />
          <SquiggleArrow className="pointer-events-none absolute -left-12 top-1/2 hidden h-16 w-24 -translate-y-1/2 text-[var(--brand-primary)] lg:block" />

          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-3xl shadow-xl"
            >
              {slide.mediaType === "IMAGE" ? (
                <img
                  src={resolveFileUrl(slide.mediaUrl) ?? undefined}
                  alt=""
                  className="aspect-[4/5] w-full object-cover"
                />
              ) : (
                <video
                  src={resolveFileUrl(slide.mediaUrl) ?? undefined}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="aspect-[4/5] w-full object-cover"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
