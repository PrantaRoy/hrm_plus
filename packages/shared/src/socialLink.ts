export interface SocialLinkDto {
  id: number;
  platform: string;
  icon: string;
  url: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSocialLinkInput {
  platform: string;
  icon: string;
  url: string;
  isActive?: boolean;
}

export type UpdateSocialLinkInput = Partial<CreateSocialLinkInput>;

export type PublicSocialLinkDto = Omit<SocialLinkDto, "isActive" | "createdAt" | "updatedAt">;

export interface ReorderSocialLinksInput {
  orderedIds: number[];
}
