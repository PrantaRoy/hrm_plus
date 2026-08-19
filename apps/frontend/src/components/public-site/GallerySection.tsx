import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PublicGalleryItemDto } from "@hrm-plus/shared";
import { resolveFileUrl } from "../../utils/fileUrl";
import { Lightbox } from "./Lightbox";
import { EYEBROW_LABEL } from "./decor/publicSiteClasses";

export function GallerySection({ data }: { data: PublicGalleryItemDto[] }) {
  const [category, setCategory] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(data.map((item) => item.category).filter((c): c is string => Boolean(c)))),
    [data]
  );
  const filtered = category ? data.filter((item) => item.category === category) : data;

  if (data.length === 0) return null;

  return (
    <section id="gallery" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="text-center">
        <span className={EYEBROW_LABEL}>Projects</span>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">Selected Works from Us</h2>
      </div>

      {categories.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setCategory(null)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              !category
                ? "bg-[var(--brand-primary)] text-white"
                : "bg-[var(--brand-primary-tint-strong)] text-slate-600"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                category === cat
                  ? "bg-[var(--brand-primary)] text-white"
                  : "bg-[var(--brand-primary-tint-strong)] text-slate-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="mt-10 grid auto-rows-[180px] grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {filtered.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.3, delay: (i % 8) * 0.04 }}
            onClick={() => setActiveIndex(i)}
            className={`group relative overflow-hidden rounded-2xl bg-slate-100 ${i % 5 === 0 ? "row-span-2" : ""}`}
          >
            <img
              src={resolveFileUrl(item.thumbnailUrl ?? item.imageUrl) ?? undefined}
              alt={item.title ?? ""}
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
            {(item.title || item.caption) && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-left text-sm text-white opacity-0 transition group-hover:opacity-100">
                {item.title && <p className="font-semibold">{item.title}</p>}
                {item.caption && <p className="text-xs text-white/80">{item.caption}</p>}
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {activeIndex !== null && (
        <Lightbox
          items={filtered}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
          onIndexChange={setActiveIndex}
        />
      )}
    </section>
  );
}
