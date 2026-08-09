import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { PublicSiteContentDto } from "@hrm-plus/shared";
import { resolveFileUrl } from "../../utils/fileUrl";

export function Navbar({ content }: { content: PublicSiteContentDto }) {
  const [open, setOpen] = useState(false);
  const { siteSettings, sections } = content;

  function scrollTo(sectionKey: string) {
    setOpen(false);
    document.getElementById(sectionKey)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          {siteSettings.logoUrl && (
            <img
              src={resolveFileUrl(siteSettings.logoUrl) ?? undefined}
              alt={siteSettings.siteTitle}
              className="h-8 w-8 object-contain"
            />
          )}
          <span className="text-lg font-semibold" style={{ color: siteSettings.primaryColor }}>
            {siteSettings.siteTitle}
          </span>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollTo(section.sectionKey)}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              {section.displayName}
            </button>
          ))}
        </nav>

        <button className="text-slate-600 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-200 md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollTo(section.sectionKey)}
                  className="rounded-md px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  {section.displayName}
                </button>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
