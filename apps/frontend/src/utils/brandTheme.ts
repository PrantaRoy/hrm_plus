import { CSSProperties } from "react";
import { PublicSiteSettingDto } from "@hrm-plus/shared";

// Fixed contrast color for dark panels (CTA panel, footer) — deliberately NOT
// derived from the tenant's primaryColor/secondaryColor, since a dark section
// needs a stable neutral backdrop regardless of the tenant's chosen brand hue.
const BRAND_NAVY = "#111827";

// Injects the tenant's brand colors as CSS custom properties so every public-site
// component can reference them via Tailwind arbitrary-value classes (e.g.
// bg-[var(--brand-primary)]) without prop drilling — this is what makes the
// public site's look actually change when a tenant edits Site Settings.
export function getBrandStyleVars(siteSettings: PublicSiteSettingDto): CSSProperties {
  const primary = siteSettings.primaryColor;
  return {
    "--brand-primary": primary,
    "--brand-secondary": siteSettings.secondaryColor,
    "--brand-primary-tint": `color-mix(in srgb, ${primary} 8%, white)`,
    "--brand-primary-tint-strong": `color-mix(in srgb, ${primary} 14%, white)`,
    "--brand-navy": BRAND_NAVY,
  } as CSSProperties;
}
