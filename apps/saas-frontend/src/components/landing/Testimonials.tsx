import { Star } from "lucide-react";
import { PublicSaasLandingBlockDto, SaasLandingSectionConfig } from "@hrm-plus/shared";
import { LandingSection } from "../LandingSection";
import { Reveal } from "../Reveal";

function initials(name: string | null): string {
  if (!name) return "–";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Testimonials({
  section,
  blocks,
}: {
  section: SaasLandingSectionConfig;
  blocks: PublicSaasLandingBlockDto[];
}) {
  if (blocks.length === 0) return null;

  return (
    <LandingSection
      id="testimonials"
      heading={section.heading}
      subheading={section.subheading}
      className="bg-slate-50"
    >
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {blocks.map((block, index) => (
          <Reveal key={block.id} delay={(index % 3) * 60}>
            <figure className="flex h-full flex-col rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
              {block.rating ? (
                <div className="mb-3 flex gap-0.5 text-amber-400">
                  {Array.from({ length: block.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              ) : null}
              <blockquote className="flex-1 text-sm leading-relaxed text-slate-700">
                “{block.subtitle ?? block.body ?? ""}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {initials(block.authorName)}
                </span>
                <span className="text-sm">
                  <span className="block font-semibold text-slate-900">
                    {block.authorName ?? "Anonymous"}
                  </span>
                  <span className="block text-slate-500">
                    {[block.authorTitle, block.company].filter(Boolean).join(", ")}
                  </span>
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </LandingSection>
  );
}
