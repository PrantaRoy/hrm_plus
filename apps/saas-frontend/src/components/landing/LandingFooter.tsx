import { PublicSaasSiteSettingsDto } from "@hrm-plus/shared";
import { Logo } from "@hrm-plus/ui";
import { resolveFileUrl } from "../../utils/fileUrl";
import { DynamicIcon } from "../DynamicIcon";
import { NavHref } from "./NavHref";

export function LandingFooter({ settings }: { settings: PublicSaasSiteSettingsDto }) {
  const logo = resolveFileUrl(settings.logoUrl);

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            {logo ? (
              <img src={logo} alt={settings.siteName} className="h-8 w-auto" />
            ) : (
              <Logo size="sm" wordmark={settings.siteName} />
            )}
            {settings.footerTagline && (
              <p className="mt-4 text-sm leading-relaxed text-slate-500">{settings.footerTagline}</p>
            )}
            {settings.socialLinks.length > 0 && (
              <div className="mt-5 flex items-center gap-3">
                {settings.socialLinks.map((social) => (
                  <a
                    key={social.url}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.platform}
                    className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:text-brand-600"
                  >
                    <DynamicIcon name={social.icon} className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {settings.footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={`${link.label}-${link.href}`}>
                    <NavHref
                      href={link.href}
                      className="text-sm text-slate-600 transition-colors hover:text-slate-900"
                    >
                      {link.label}
                    </NavHref>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {settings.footerLegalText && (
          <p className="mt-12 border-t border-slate-200 pt-6 text-xs text-slate-400">
            {settings.footerLegalText}
          </p>
        )}
      </div>
    </footer>
  );
}
