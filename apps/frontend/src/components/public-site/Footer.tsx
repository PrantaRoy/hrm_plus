import { Link } from "react-router-dom";
import { PublicSiteContentDto } from "@hrm-plus/shared";
import { LucideIcon } from "../../utils/lucideIcon";

export function Footer({ content, tenantSlug }: { content: PublicSiteContentDto; tenantSlug: string }) {
  const { siteSettings, socialLinks, legalPages } = content;

  return (
    <footer className="bg-[var(--brand-navy)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-white">{siteSettings.siteTitle}</h3>
            {siteSettings.tagline && <p className="mt-2 text-sm text-white/60">{siteSettings.tagline}</p>}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Contact</h3>
            <ul className="mt-2 space-y-1 text-sm text-white/60">
              {siteSettings.contactEmail && <li>{siteSettings.contactEmail}</li>}
              {siteSettings.contactPhone && <li>{siteSettings.contactPhone}</li>}
              {siteSettings.contactAddress && <li>{siteSettings.contactAddress}</li>}
            </ul>
          </div>

          <div>
            {legalPages.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-white">Legal</h3>
                <ul className="mt-2 space-y-1 text-sm text-white/60">
                  {legalPages.map((page) => (
                    <li key={page.slug}>
                      <Link to={`/site/${tenantSlug}/legal/${page.slug}`} className="hover:text-white">
                        {page.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {socialLinks.length > 0 && (
              <div className={legalPages.length > 0 ? "mt-4" : ""}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-white/40">Get in Touch</h3>
                <div className="mt-2 flex gap-2">
                  {socialLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={link.platform}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-[var(--brand-primary)]"
                    >
                      <LucideIcon name={link.icon} size={16} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} {siteSettings.siteTitle}. All rights reserved.
          </p>
          <Link to="/login" className="text-xs font-medium text-white/60 hover:text-white">
            Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
