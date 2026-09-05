import { PublicSaasLandingBlockDto, SaasLandingSectionConfig } from "@hrm-plus/shared";
import { LandingSection } from "../LandingSection";
import { Reveal } from "../Reveal";

export function ProcessSteps({
  section,
  blocks,
}: {
  section: SaasLandingSectionConfig;
  blocks: PublicSaasLandingBlockDto[];
}) {
  if (blocks.length === 0) return null;

  const steps = [...blocks].sort(
    (a, b) => (a.stepNumber ?? a.sortOrder) - (b.stepNumber ?? b.sortOrder)
  );

  return (
    <LandingSection id="process" heading={section.heading} subheading={section.subheading}>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <Reveal key={step.id} delay={index * 70}>
            <div className="relative h-full rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                {step.stepNumber ?? index + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{step.title}</h3>
              {step.subtitle && (
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{step.subtitle}</p>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </LandingSection>
  );
}
