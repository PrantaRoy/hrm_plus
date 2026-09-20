import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LogIn, Menu, X } from "lucide-react";
import { PublicSiteContentDto } from "@hrm-plus/shared";
import { resolveFileUrl } from "../../utils/fileUrl";
import { PILL_BUTTON_OUTLINE, PILL_BUTTON_PRIMARY } from "./decor/publicSiteClasses";

export function Navbar({ content }: { content: PublicSiteContentDto }) {
  const [open, setOpen] = useState(false);
  const { siteSettings, sections } = content;
  const hasContactSection = sections.some((section) => section.sectionKey === "contact");

  function scrollTo(sectionKey: string) {
    setOpen(false);
    document.getElementById(sectionKey)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          {siteSettings.logoUrl && (
            <img
              src={resolveFileUrl(siteSettings.logoUrl) ?? undefined}
              alt={siteSettings.siteTitle}
              className="h-8 w-8 object-contain"
            />
          )}
          <span className="text-lg font-bold uppercase tracking-tight text-[var(--brand-primary)]">
            {siteSettings.siteTitle}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden items-center gap-6 md:flex">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollTo(section.sectionKey)}
                className="text-sm font-medium text-slate-600 hover:text-[var(--brand-primary)]"
              >
                {section.displayName}
              </button>
            ))}
          </nav>

          {hasContactSection && (
            <a href="#contact" className={`hidden md:inline-flex ${PILL_BUTTON_OUTLINE}`}>
              Let's Talk
            </a>
          )}

          <Link to="/login" className={`hidden !px-5 !py-2 md:inline-flex ${PILL_BUTTON_PRIMARY}`}>
            <LogIn size={16} />
            Login
          </Link>

          <button className="text-slate-600 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100 md:hidden"
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
              <Link to="/login" onClick={() => setOpen(false)} className={`mt-2 !py-2.5 ${PILL_BUTTON_PRIMARY}`}>
                <LogIn size={16} />
                Login
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
