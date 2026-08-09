import { HeroMediaType, HeroSlideDto, PublicHeroSlideDto } from "@hrm-plus/shared";

type HeroSlideRecord = {
  id: number;
  headline: string;
  subHeadline: string | null;
  mediaType: string;
  mediaUrl: string;
  ctaPrimaryText: string | null;
  ctaPrimaryUrl: string | null;
  ctaSecondaryText: string | null;
  ctaSecondaryUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function toHeroSlideDto(slide: HeroSlideRecord): HeroSlideDto {
  return {
    id: slide.id,
    headline: slide.headline,
    subHeadline: slide.subHeadline,
    mediaType: slide.mediaType as HeroMediaType,
    mediaUrl: slide.mediaUrl,
    ctaPrimaryText: slide.ctaPrimaryText,
    ctaPrimaryUrl: slide.ctaPrimaryUrl,
    ctaSecondaryText: slide.ctaSecondaryText,
    ctaSecondaryUrl: slide.ctaSecondaryUrl,
    sortOrder: slide.sortOrder,
    isActive: slide.isActive,
    createdAt: slide.createdAt.toISOString(),
    updatedAt: slide.updatedAt.toISOString(),
  };
}

export function toPublicHeroSlideDto(slide: HeroSlideRecord): PublicHeroSlideDto {
  return {
    id: slide.id,
    headline: slide.headline,
    subHeadline: slide.subHeadline,
    mediaType: slide.mediaType as HeroMediaType,
    mediaUrl: slide.mediaUrl,
    ctaPrimaryText: slide.ctaPrimaryText,
    ctaPrimaryUrl: slide.ctaPrimaryUrl,
    ctaSecondaryText: slide.ctaSecondaryText,
    ctaSecondaryUrl: slide.ctaSecondaryUrl,
    sortOrder: slide.sortOrder,
  };
}
