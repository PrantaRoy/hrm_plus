import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { PackageDto, SaasLandingSectionConfig } from "@hrm-plus/shared";
import { LandingSection } from "../LandingSection";
import { Reveal } from "../Reveal";

function formatPrice(pkg: PackageDto): string {
  return pkg.price === 0 ? "Free" : `$${pkg.price.toFixed(2)}`;
}

export function Pricing({
  section,
  packages,
}: {
  section: SaasLandingSectionConfig;
  packages: PackageDto[];
}) {
  return (
    <LandingSection id="pricing" heading={section.heading} subheading={section.subheading}>
      {packages.length === 0 ? (
        <p className="text-slate-500">Plans are being finalised — check back soon.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg, index) => (
            <Reveal key={pkg.id} delay={(index % 3) * 60}>
              <div
                className={`flex h-full flex-col rounded-2xl border bg-white p-7 shadow-sm ${
                  pkg.isPopular ? "border-brand-400 ring-1 ring-brand-400" : "border-slate-200/70"
                }`}
              >
                {pkg.isPopular && (
                  <span className="mb-3 inline-flex w-fit items-center rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-slate-900">{pkg.name}</h3>
                {pkg.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{pkg.description}</p>
                )}
                <div className="mt-5 flex items-end gap-1.5">
                  <span className="text-3xl font-semibold tracking-tight text-slate-900">
                    {formatPrice(pkg)}
                  </span>
                  {pkg.billingPeriod && (
                    <span className="pb-1 text-sm text-slate-500">{pkg.billingPeriod}</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {pkg.validityDays ? `${pkg.validityDays}-day validity` : "Unlimited validity"}
                </p>

                {pkg.features.length > 0 && (
                  <ul className="mt-6 space-y-2.5">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <Link
                  to={`/signup?packageId=${pkg.id}`}
                  className={`mt-7 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                    pkg.isPopular
                      ? "bg-brand-600 text-white hover:bg-brand-700"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {pkg.ctaLabel ?? "Get started"}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      )}
      <p className="mt-6 text-center text-xs text-slate-400">No card required to apply.</p>
    </LandingSection>
  );
}
