import {
  PublicSaasLandingBlockDto,
  PublicSaasSiteSettingsDto,
  SaasFooterColumn,
  SaasLandingBlockDto,
  SaasLandingBlockType,
  SaasLandingSectionConfig,
  SaasNavLink,
  SaasSiteSettingsDto,
  SaasSocialLink,
} from "@hrm-plus/shared";
import { SaasLandingBlock, SaasSiteSettings } from "../../../../generated/control";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function toSaasSiteSettingsDto(s: SaasSiteSettings): SaasSiteSettingsDto {
  return {
    id: s.id,
    siteName: s.siteName,
    logoUrl: s.logoUrl,
    logoKey: s.logoKey,
    faviconUrl: s.faviconUrl,
    faviconKey: s.faviconKey,
    navLinks: asArray<SaasNavLink>(s.navLinks),
    headerCtaLabel: s.headerCtaLabel,
    headerCtaHref: s.headerCtaHref,
    loginUrl: s.loginUrl,
    heroEyebrow: s.heroEyebrow,
    heroHeadline: s.heroHeadline,
    heroSubheadline: s.heroSubheadline,
    heroPrimaryCtaLabel: s.heroPrimaryCtaLabel,
    heroPrimaryCtaHref: s.heroPrimaryCtaHref,
    heroSecondaryCtaLabel: s.heroSecondaryCtaLabel,
    heroSecondaryCtaHref: s.heroSecondaryCtaHref,
    heroImageUrl: s.heroImageUrl,
    heroImageKey: s.heroImageKey,
    sections: asArray<SaasLandingSectionConfig>(s.sections),
    ctaHeading: s.ctaHeading,
    ctaSubheading: s.ctaSubheading,
    ctaButtonLabel: s.ctaButtonLabel,
    ctaButtonHref: s.ctaButtonHref,
    contactHeading: s.contactHeading,
    contactSubheading: s.contactSubheading,
    contactEmail: s.contactEmail,
    contactPhone: s.contactPhone,
    contactAddress: s.contactAddress,
    footerTagline: s.footerTagline,
    footerColumns: asArray<SaasFooterColumn>(s.footerColumns),
    socialLinks: asArray<SaasSocialLink>(s.socialLinks),
    footerLegalText: s.footerLegalText,
    metaTitle: s.metaTitle,
    metaDescription: s.metaDescription,
    ogImageUrl: s.ogImageUrl,
    ogImageKey: s.ogImageKey,
    updatedAt: s.updatedAt.toISOString(),
  };
}

export function toPublicSaasSiteSettingsDto(s: SaasSiteSettings): PublicSaasSiteSettingsDto {
  const {
    id: _id,
    logoKey: _logoKey,
    faviconKey: _faviconKey,
    heroImageKey: _heroImageKey,
    ogImageKey: _ogImageKey,
    updatedAt: _updatedAt,
    ...rest
  } = toSaasSiteSettingsDto(s);
  return rest;
}

interface BlockMeta {
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

export function toSaasLandingBlockDto(b: SaasLandingBlock): SaasLandingBlockDto {
  const meta = (b.meta ?? {}) as BlockMeta;
  return {
    id: b.id,
    blockType: b.blockType as SaasLandingBlockType,
    title: b.title,
    subtitle: b.subtitle,
    body: b.body,
    icon: b.icon,
    mediaUrl: b.mediaUrl,
    mediaKey: b.mediaKey,
    sortOrder: b.sortOrder,
    isActive: b.isActive,
    bullets: Array.isArray(meta.bullets) ? meta.bullets : [],
    ctaLabel: meta.ctaLabel ?? null,
    ctaHref: meta.ctaHref ?? null,
    stepNumber: meta.stepNumber ?? null,
    value: meta.value ?? null,
    suffix: meta.suffix ?? null,
    authorName: meta.authorName ?? null,
    authorTitle: meta.authorTitle ?? null,
    company: meta.company ?? null,
    rating: meta.rating ?? null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

export function toPublicSaasLandingBlockDto(b: SaasLandingBlock): PublicSaasLandingBlockDto {
  const {
    mediaKey: _mediaKey,
    isActive: _isActive,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = toSaasLandingBlockDto(b);
  return rest;
}
