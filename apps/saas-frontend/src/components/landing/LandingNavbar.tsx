import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogIn, Menu, X } from "lucide-react";
import { PublicSaasSiteSettingsDto } from "@hrm-plus/shared";
import { Logo } from "@hrm-plus/ui";
import { resolveFileUrl } from "../../utils/fileUrl";
import { NavHref } from "./NavHref";

export function LandingNavbar({ settings }: { settings: PublicSaasSiteSettingsDto }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const logo = resolveFileUrl(settings.logoUrl);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-colors ${
        scrolled ? "border-b border-slate-200 bg-white/90 backdrop-blur" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          {logo ? (
            <img src={logo} alt={settings.siteName} className="h-8 w-auto" />
          ) : (
            <Logo size="sm" wordmark={settings.siteName} />
          )}
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {settings.navLinks.map((link) => (
            <NavHref
              key={`${link.label}-${link.href}`}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {link.label}
            </NavHref>
          ))}
        </nav>

        <div className="hidden items-center md:flex">
          <NavHref
            href={settings.loginUrl}
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            <LogIn className="h-4 w-4" />
            Login
          </NavHref>
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-slate-600 md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {settings.navLinks.map((link) => (
              <NavHref
                key={`m-${link.label}-${link.href}`}
                href={link.href}
                className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavHref>
            ))}
            <NavHref
              href={settings.loginUrl}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => setMenuOpen(false)}
            >
              <LogIn className="h-4 w-4" />
              Login
            </NavHref>
          </nav>
        </div>
      )}
    </header>
  );
}
