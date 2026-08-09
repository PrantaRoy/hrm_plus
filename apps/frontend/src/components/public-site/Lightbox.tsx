import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PublicGalleryItemDto } from "@hrm-plus/shared";
import { resolveFileUrl } from "../../utils/fileUrl";

export interface LightboxProps {
  items: PublicGalleryItemDto[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function Lightbox({ items, index, onClose, onIndexChange }: LightboxProps) {
  const item = items[index];

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange((index + 1) % items.length);
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + items.length) % items.length);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [index, items.length, onClose, onIndexChange]);

  if (!item) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
        onClick={onClose}
      >
        <button className="absolute right-4 top-4 text-white/70 hover:text-white" onClick={onClose} aria-label="Close">
          <X size={28} />
        </button>
        {items.length > 1 && (
          <>
            <button
              className="absolute left-4 text-white/70 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange((index - 1 + items.length) % items.length);
              }}
              aria-label="Previous"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              className="absolute right-4 text-white/70 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange((index + 1) % items.length);
              }}
              aria-label="Next"
            >
              <ChevronRight size={32} />
            </button>
          </>
        )}
        <motion.img
          key={item.id}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          src={resolveFileUrl(item.imageUrl) ?? undefined}
          alt={item.title ?? ""}
          className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
          onClick={(e) => e.stopPropagation()}
        />
        {item.caption && <p className="absolute bottom-6 text-sm text-white/80">{item.caption}</p>}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
