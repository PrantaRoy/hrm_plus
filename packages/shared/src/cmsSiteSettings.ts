export interface BusinessHourEntry {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface SiteSettingDto {
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
  businessHours: BusinessHourEntry[] | null;
  aboutHeading: string | null;
  aboutContent: string | null;
  metaDescription: string | null;
  updatedById: number | null;
  updatedAt: string;
}

export type PublicSiteSettingDto = Omit<SiteSettingDto, "id" | "updatedById" | "updatedAt">;

export interface UpdateSiteSettingInput {
  siteTitle?: string;
  tagline?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactAddress?: string | null;
  businessHours?: BusinessHourEntry[] | null;
  aboutHeading?: string | null;
  aboutContent?: string | null;
  metaDescription?: string | null;
}
