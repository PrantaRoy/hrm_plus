import { ReactNode } from "react";
import { Reveal } from "./Reveal";

interface LandingSectionProps {
  id?: string;
  eyebrow?: string | null;
  heading?: string | null;
  subheading?: string | null;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  headingClassName?: string;
}

export function LandingSection({
  id,
  eyebrow,
  heading,
  subheading,
  children,
  className = "",
  containerClassName = "mx-auto max-w-6xl px-4 sm:px-6",
  headingClassName = "",
}: LandingSectionProps) {
  return (
    <section id={id} className={`scroll-mt-24 py-20 sm:py-28 ${className}`}>
      <div className={containerClassName}>
        {(eyebrow || heading || subheading) && (
          <Reveal className={`mb-12 max-w-2xl ${headingClassName}`}>
            {eyebrow && (
              <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
                {eyebrow}
              </span>
            )}
            {heading && (
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                {heading}
              </h2>
            )}
            {subheading && <p className="mt-4 text-lg leading-relaxed text-slate-600">{subheading}</p>}
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}
