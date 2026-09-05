import { PublicSaasLandingBlockDto, SaasLandingSectionConfig } from "@hrm-plus/shared";
import { Reveal } from "../Reveal";

export function StatsBand({
  section,
  blocks,
}: {
  section: SaasLandingSectionConfig;
  blocks: PublicSaasLandingBlockDto[];
}) {
  if (blocks.length === 0) return null;

  return (
    <section id="stats" className="scroll-mt-24 bg-brand-600 py-16 text-white sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {section.heading && (
          <h2 className="mb-10 max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
            {section.heading}
          </h2>
        )}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {blocks.map((block, index) => (
            <Reveal key={block.id} delay={index * 60}>
              <div>
                <div className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {block.value ?? ""}
                  {block.suffix ? <span className="text-brand-200">{block.suffix}</span> : null}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-brand-100">{block.title}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
