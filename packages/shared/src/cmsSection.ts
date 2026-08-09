export const SITE_SECTION_KEYS = [
  "hero",
  "about",
  "overview",
  "gallery",
  "careers",
  "blogs",
  "contact",
] as const;
export type SiteSectionKey = (typeof SITE_SECTION_KEYS)[number];

export interface SiteSectionDto {
  id: number;
  sectionKey: SiteSectionKey;
  displayName: string;
  isEnabled: boolean;
  sortOrder: number;
}

export interface UpdateSiteSectionInput {
  displayName?: string;
  isEnabled?: boolean;
}

export interface ReorderSiteSectionsInput {
  orderedIds: number[];
}
