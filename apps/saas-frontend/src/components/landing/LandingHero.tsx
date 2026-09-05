import { PublicSaasSiteSettingsDto } from "@hrm-plus/shared";
import { resolveFileUrl } from "../../utils/fileUrl";
import { NavHref } from "./NavHref";

export function LandingHero({ settings }: { settings: PublicSaasSiteSettingsDto }) {
  const heroImage = resolveFileUrl(settings.heroImageUrl);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-brand-200/50 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:items-center">
        <div>
          {settings.heroEyebrow && (
            <span className="inline-flex items-center rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
              {settings.heroEyebrow}
            </span>
          )}
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            {settings.heroHeadline}
          </h1>
          {settings.heroSubheadline && (
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              {settings.heroSubheadline}
            </p>
          )}
          <div className="mt-9 flex flex-wrap items-center gap-3">
            {settings.heroPrimaryCtaLabel && settings.heroPrimaryCtaHref && (
              <NavHref
                href={settings.heroPrimaryCtaHref}
                className="inline-flex items-center rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                {settings.heroPrimaryCtaLabel}
              </NavHref>
            )}
            {settings.heroSecondaryCtaLabel && settings.heroSecondaryCtaHref && (
              <NavHref
                href={settings.heroSecondaryCtaHref}
                className="inline-flex items-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                {settings.heroSecondaryCtaLabel}
              </NavHref>
            )}
          </div>
        </div>

        <div className="relative">
          {heroImage ? (
            <img
              src={heroImage}
              alt=""
              className="w-full rounded-2xl border border-slate-200 shadow-xl"
            />
          ) : (
            <div className="aspect-[4/3] w-full rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-100 via-white to-brand-50 shadow-xl">
              <div className="flex h-full items-center justify-center">
                <div className="grid w-3/4 gap-3">
                  <div className="h-3 w-1/2 rounded-full bg-brand-200" />
                  <div className="h-24 rounded-xl bg-white shadow-sm ring-1 ring-slate-200/70" />
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-16 rounded-lg bg-white shadow-sm ring-1 ring-slate-200/70" />
                    <div className="h-16 rounded-lg bg-white shadow-sm ring-1 ring-slate-200/70" />
                    <div className="h-16 rounded-lg bg-white shadow-sm ring-1 ring-slate-200/70" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
