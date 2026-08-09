import { LegalPageDto, PublicLegalPageDto } from "@hrm-plus/shared";

type LegalPageRecord = {
  id: number;
  slug: string;
  title: string;
  content: string;
  updatedById: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toLegalPageDto(page: LegalPageRecord): LegalPageDto {
  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    content: page.content,
    updatedById: page.updatedById,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  };
}

export function toPublicLegalPageDto(page: LegalPageRecord): PublicLegalPageDto {
  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    content: page.content,
  };
}
