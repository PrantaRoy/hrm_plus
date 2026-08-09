import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PublicGalleryItemDto } from "@hrm-plus/shared";
import { resolveFileUrl } from "../../utils/fileUrl";
import { Lightbox } from "./Lightbox";

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
      <h2 className="text-center text-3xl font-bold text-slate-900">Gallery</h2>

      {categories.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setCategory(null)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              !category ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                category === cat ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {filtered.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.3, delay: (i % 8) * 0.04 }}
            onClick={() => setActiveIndex(i)}
            className="aspect-square overflow-hidden rounded-lg bg-slate-100"
          >
            <img
              src={resolveFileUrl(item.thumbnailUrl ?? item.imageUrl) ?? undefined}
              alt={item.title ?? ""}
              className="h-full w-full object-cover transition hover:scale-105"
            />
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
