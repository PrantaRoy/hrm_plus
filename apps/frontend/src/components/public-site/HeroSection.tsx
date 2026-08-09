import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PublicHeroSlideDto } from "@hrm-plus/shared";
import { resolveFileUrl } from "../../utils/fileUrl";

export function HeroSection({ data }: { data: PublicHeroSlideDto[] }) {
  const [index, setIndex] = useState(0);
  const slide = data[index];

  useEffect(() => {
    if (data.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % data.length), 6000);
    return () => clearInterval(timer);
  }, [data.length]);

  if (!slide) return null;

  return (
    <section id="hero" className="relative isolate overflow-hidden bg-slate-900">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          {slide.mediaType === "IMAGE" ? (
            <img
              src={resolveFileUrl(slide.mediaUrl) ?? undefined}
              alt=""
              className="h-full w-full object-cover opacity-50"
            />
          ) : (
            <video
              src={resolveFileUrl(slide.mediaUrl) ?? undefined}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover opacity-50"
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="relative mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{slide.headline}</h1>
            {slide.subHeadline && <p className="mt-4 text-lg text-slate-200">{slide.subHeadline}</p>}
            <div className="mt-8 flex justify-center gap-4">
              {slide.ctaPrimaryText && slide.ctaPrimaryUrl && (
                <a
                  href={slide.ctaPrimaryUrl}
                  className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                >
                  {slide.ctaPrimaryText}
                </a>
              )}
              {slide.ctaSecondaryText && slide.ctaSecondaryUrl && (
                <a
                  href={slide.ctaSecondaryUrl}
                  className="rounded-md border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                >
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
                className={`h-2 w-2 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
