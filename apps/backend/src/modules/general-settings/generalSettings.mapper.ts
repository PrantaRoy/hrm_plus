import { DateFormat, GeneralSettingsDto, TimeFormat } from "@hrm-plus/shared";

export function toGeneralSettingsDto(settings: {
  id: number;
  siteTitle: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  currency: string;
  language: string;
  copyrightText: string | null;
  updatedById: number | null;
  updatedAt: Date;
}): GeneralSettingsDto {
  return {
    id: settings.id,
    siteTitle: settings.siteTitle,
    logoUrl: settings.logoUrl,
    faviconUrl: settings.faviconUrl,
    dateFormat: settings.dateFormat as DateFormat,
    timeFormat: settings.timeFormat as TimeFormat,
    timezone: settings.timezone,
    currency: settings.currency,
    language: settings.language,
    copyrightText: settings.copyrightText,
    updatedById: settings.updatedById,
    updatedAt: settings.updatedAt.toISOString(),
  };
}
