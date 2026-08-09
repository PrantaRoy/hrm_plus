import { Link } from "react-router-dom";
import { PublicSiteContentDto } from "@hrm-plus/shared";
import { LucideIcon } from "../../utils/lucideIcon";

export function Footer({ content, tenantSlug }: { content: PublicSiteContentDto; tenantSlug: string }) {
  const { siteSettings, socialLinks, legalPages } = content;

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{siteSettings.siteTitle}</h3>
            {siteSettings.tagline && <p className="mt-2 text-sm text-slate-500">{siteSettings.tagline}</p>}
            {socialLinks.length > 0 && (
              <div className="mt-4 flex gap-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-slate-700"
                    aria-label={link.platform}
                  >
                    <LucideIcon name={link.icon} size={18} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Contact</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-500">
              {siteSettings.contactEmail && <li>{siteSettings.contactEmail}</li>}
              {siteSettings.contactPhone && <li>{siteSettings.contactPhone}</li>}
              {siteSettings.contactAddress && <li>{siteSettings.contactAddress}</li>}
            </ul>
          </div>

          {legalPages.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Legal</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-500">
                {legalPages.map((page) => (
                  <li key={page.slug}>
                    <Link to={`/site/${tenantSlug}/legal/${page.slug}`} className="hover:text-slate-800">
                      {page.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <p className="mt-8 text-xs text-slate-400">
          © {new Date().getFullYear()} {siteSettings.siteTitle}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
