import { BusinessHourEntry, PublicSiteSettingDto, SiteSettingDto } from "@hrm-plus/shared";

type SiteSettingRecord = {
  id: number;
  siteTitle: string;
  tagline: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  businessHours: unknown;
  aboutHeading: string | null;
  aboutContent: string | null;
  metaDescription: string | null;
  updatedById: number | null;
  updatedAt: Date;
};

export function toSiteSettingDto(settings: SiteSettingRecord): SiteSettingDto {
  return {
    id: settings.id,
    siteTitle: settings.siteTitle,
    tagline: settings.tagline,
    logoUrl: settings.logoUrl,
    faviconUrl: settings.faviconUrl,
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    contactAddress: settings.contactAddress,
    businessHours: (settings.businessHours as BusinessHourEntry[] | null) ?? null,
    aboutHeading: settings.aboutHeading,
    aboutContent: settings.aboutContent,
    metaDescription: settings.metaDescription,
    updatedById: settings.updatedById,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export function toPublicSiteSettingDto(settings: SiteSettingRecord): PublicSiteSettingDto {
  return {
    siteTitle: settings.siteTitle,
    tagline: settings.tagline,
    logoUrl: settings.logoUrl,
    faviconUrl: settings.faviconUrl,
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    contactAddress: settings.contactAddress,
    businessHours: (settings.businessHours as BusinessHourEntry[] | null) ?? null,
    aboutHeading: settings.aboutHeading,
    aboutContent: settings.aboutContent,
    metaDescription: settings.metaDescription,
  };
}
