import { PublicSaasSiteSettingsDto } from "@hrm-plus/shared";
import { Reveal } from "../Reveal";
import { NavHref } from "./NavHref";

export function CtaBand({ settings }: { settings: PublicSaasSiteSettingsDto }) {
  if (!settings.ctaHeading) return null;

  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-8 py-14 text-center text-white shadow-lg sm:px-16">
            <h2 className="mx-auto max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
              {settings.ctaHeading}
            </h2>
            {settings.ctaSubheading && (
              <p className="mx-auto mt-4 max-w-xl text-brand-50">{settings.ctaSubheading}</p>
            )}
            {settings.ctaButtonLabel && settings.ctaButtonHref && (
              <NavHref
                href={settings.ctaButtonHref}
                className="mt-8 inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
              >
                {settings.ctaButtonLabel}
              </NavHref>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
