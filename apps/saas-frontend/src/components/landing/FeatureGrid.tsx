import { PublicSaasLandingBlockDto, SaasLandingSectionConfig } from "@hrm-plus/shared";
import { LandingSection } from "../LandingSection";
import { Reveal } from "../Reveal";
import { DynamicIcon } from "../DynamicIcon";

export function FeatureGrid({
  section,
  blocks,
}: {
  section: SaasLandingSectionConfig;
  blocks: PublicSaasLandingBlockDto[];
}) {
  if (blocks.length === 0) return null;

  return (
    <LandingSection
      id="features"
      heading={section.heading}
      subheading={section.subheading}
      className="bg-slate-50"
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {blocks.map((block, index) => (
          <Reveal key={block.id} delay={(index % 3) * 60}>
            <div className="h-full rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                <DynamicIcon name={block.icon} className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{block.title}</h3>
              {block.subtitle && (
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{block.subtitle}</p>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </LandingSection>
  );
}
