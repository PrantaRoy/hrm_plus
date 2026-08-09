import { PublicSocialLinkDto, SocialLinkDto } from "@hrm-plus/shared";

type SocialLinkRecord = {
  id: number;
  platform: string;
  icon: string;
  url: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function toSocialLinkDto(link: SocialLinkRecord): SocialLinkDto {
  return {
    id: link.id,
    platform: link.platform,
    icon: link.icon,
    url: link.url,
    sortOrder: link.sortOrder,
    isActive: link.isActive,
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
  };
}

export function toPublicSocialLinkDto(link: SocialLinkRecord): PublicSocialLinkDto {
  return {
    id: link.id,
    platform: link.platform,
    icon: link.icon,
    url: link.url,
    sortOrder: link.sortOrder,
  };
}
