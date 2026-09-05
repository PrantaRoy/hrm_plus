import { Check } from "lucide-react";
import { PublicSaasLandingBlockDto, SaasLandingSectionConfig } from "@hrm-plus/shared";
import { LandingSection } from "../LandingSection";
import { Reveal } from "../Reveal";
import { DynamicIcon } from "../DynamicIcon";
import { resolveFileUrl } from "../../utils/fileUrl";
import { NavHref } from "./NavHref";

export function FeatureHighlights({
  section,
  blocks,
}: {
  section: SaasLandingSectionConfig;
  blocks: PublicSaasLandingBlockDto[];
}) {
  if (blocks.length === 0) return null;

  return (
    <LandingSection
      id="feature-highlights"
      heading={section.heading}
      subheading={section.subheading}
    >
      <div className="space-y-16">
        {blocks.map((block, index) => {
          const media = resolveFileUrl(block.mediaUrl);
          const flip = index % 2 === 1;
          return (
            <Reveal key={block.id}>
              <div className="grid items-center gap-8 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-10 lg:grid-cols-2">
                <div className={flip ? "lg:order-2" : ""}>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
                    <DynamicIcon name={block.icon} className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
                    {block.title}
                  </h3>
                  {block.subtitle && (
                    <p className="mt-2 text-lg font-medium text-brand-700">{block.subtitle}</p>
                  )}
                  {block.body && (
                    <p className="mt-3 leading-relaxed text-slate-600">{block.body}</p>
                  )}
                  {block.bullets.length > 0 && (
                    <ul className="mt-5 space-y-2.5">
                      {block.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2.5 text-sm text-slate-700">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {block.ctaLabel && block.ctaHref && (
                    <NavHref
                      href={block.ctaHref}
                      className="mt-6 inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      {block.ctaLabel}
                    </NavHref>
                  )}
                </div>

                <div className={flip ? "lg:order-1" : ""}>
                  {media ? (
                    <img
                      src={media}
                      alt=""
                      className="w-full rounded-2xl border border-slate-200 shadow-sm"
                    />
                  ) : (
                    <div className="aspect-[4/3] w-full rounded-2xl bg-gradient-to-br from-brand-50 via-white to-slate-50 ring-1 ring-inset ring-slate-200/70">
                      <div className="flex h-full items-center justify-center">
                        <DynamicIcon name={block.icon} className="h-16 w-16 text-brand-200" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </LandingSection>
  );
}
