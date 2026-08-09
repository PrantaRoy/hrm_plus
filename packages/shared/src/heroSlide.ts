export const HERO_MEDIA_TYPES = ["IMAGE", "VIDEO"] as const;
export type HeroMediaType = (typeof HERO_MEDIA_TYPES)[number];

export interface HeroSlideDto {
  id: number;
  headline: string;
  subHeadline: string | null;
  mediaType: HeroMediaType;
  mediaUrl: string;
  ctaPrimaryText: string | null;
  ctaPrimaryUrl: string | null;
  ctaSecondaryText: string | null;
  ctaSecondaryUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHeroSlideInput {
  headline: string;
  subHeadline?: string;
  mediaType: HeroMediaType;
  ctaPrimaryText?: string;
  ctaPrimaryUrl?: string;
  ctaSecondaryText?: string;
  ctaSecondaryUrl?: string;
  isActive?: boolean;
}

export type UpdateHeroSlideInput = Partial<CreateHeroSlideInput>;

export type PublicHeroSlideDto = Omit<HeroSlideDto, "isActive" | "createdAt" | "updatedAt">;

export interface ReorderHeroSlidesInput {
  orderedIds: number[];
}
