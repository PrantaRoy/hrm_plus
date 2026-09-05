import type { PackageDto } from "./saas";

export const SAAS_LANDING_BLOCK_TYPES = [
  "FEATURE_HIGHLIGHT",
  "FEATURE",
  "PROCESS_STEP",
  "STAT",
  "TESTIMONIAL",
] as const;
export type SaasLandingBlockType = (typeof SAAS_LANDING_BLOCK_TYPES)[number];

export const SAAS_LANDING_SECTION_KEYS = [
  "feature-highlights",
  "features",
  "process",
  "stats",
  "testimonials",
  "pricing",
  "blog",
  "contact",
] as const;
export type SaasLandingSectionKey = (typeof SAAS_LANDING_SECTION_KEYS)[number];

export interface SaasNavLink {
  label: string;
  href: string;
}

export interface SaasFooterColumn {
  title: string;
  links: SaasNavLink[];
}

export interface SaasSocialLink {
  platform: string;
  icon: string;
  url: string;
}

export interface SaasLandingSectionConfig {
  key: string;
  label: string;
  heading: string | null;
  subheading: string | null;
  enabled: boolean;
  order: number;
}

export interface SaasSiteSettingsDto {
  id: number;
  siteName: string;
  logoUrl: string | null;
  logoKey: string | null;
  faviconUrl: string | null;
  faviconKey: string | null;
  navLinks: SaasNavLink[];
  headerCtaLabel: string;
  headerCtaHref: string;
  loginUrl: string;
  heroEyebrow: string | null;
  heroHeadline: string;
  heroSubheadline: string | null;
  heroPrimaryCtaLabel: string | null;
  heroPrimaryCtaHref: string | null;
  heroSecondaryCtaLabel: string | null;
  heroSecondaryCtaHref: string | null;
  heroImageUrl: string | null;
  heroImageKey: string | null;
  sections: SaasLandingSectionConfig[];
  ctaHeading: string | null;
  ctaSubheading: string | null;
  ctaButtonLabel: string | null;
  ctaButtonHref: string | null;
  contactHeading: string | null;
  contactSubheading: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  footerTagline: string | null;
  footerColumns: SaasFooterColumn[];
  socialLinks: SaasSocialLink[];
  footerLegalText: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
  ogImageKey: string | null;
  updatedAt: string;
}

export type PublicSaasSiteSettingsDto = Omit<
  SaasSiteSettingsDto,
  "id" | "logoKey" | "faviconKey" | "heroImageKey" | "ogImageKey" | "updatedAt"
>;

export type UpdateSaasSiteSettingsInput = Partial<
  Omit<
    SaasSiteSettingsDto,
    "id" | "logoKey" | "faviconKey" | "heroImageKey" | "ogImageKey" | "updatedAt"
  >
>;

// Flat DTO — type-specific extras are surfaced as optional fields, populated only
// for the relevant blockType. Keeps admin forms and public renderers simple.
export interface SaasLandingBlockDto {
  id: number;
  blockType: SaasLandingBlockType;
  title: string;
  subtitle: string | null;
  body: string | null;
  icon: string | null;
  mediaUrl: string | null;
  mediaKey: string | null;
  sortOrder: number;
  isActive: boolean;
  // FEATURE_HIGHLIGHT
  bullets: string[];
  ctaLabel: string | null;
  ctaHref: string | null;
  // PROCESS_STEP
  stepNumber: number | null;
  // STAT
  value: string | null;
  suffix: string | null;
  // TESTIMONIAL
  authorName: string | null;
  authorTitle: string | null;
  company: string | null;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
}

export type PublicSaasLandingBlockDto = Omit<
  SaasLandingBlockDto,
  "mediaKey" | "isActive" | "createdAt" | "updatedAt"
>;

export interface CreateSaasLandingBlockInput {
  blockType: SaasLandingBlockType;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  icon?: string | null;
  isActive?: boolean;
  bullets?: string[];
  ctaLabel?: string | null;
  ctaHref?: string | null;
  stepNumber?: number | null;
  value?: string | null;
  suffix?: string | null;
  authorName?: string | null;
  authorTitle?: string | null;
  company?: string | null;
  rating?: number | null;
}

export type UpdateSaasLandingBlockInput = Partial<Omit<CreateSaasLandingBlockInput, "blockType">>;

export interface ReorderSaasLandingBlocksInput {
  blockType: SaasLandingBlockType;
  orderedIds: number[];
}

export interface SaasLandingContentDto {
  settings: PublicSaasSiteSettingsDto;
  featureHighlights: PublicSaasLandingBlockDto[];
  features: PublicSaasLandingBlockDto[];
  processSteps: PublicSaasLandingBlockDto[];
  stats: PublicSaasLandingBlockDto[];
  testimonials: PublicSaasLandingBlockDto[];
  packages: PackageDto[];
}
