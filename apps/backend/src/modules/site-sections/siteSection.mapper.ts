import { SiteSectionDto, SiteSectionKey } from "@hrm-plus/shared";

export function toSiteSectionDto(section: {
  id: number;
  sectionKey: string;
  displayName: string;
  isEnabled: boolean;
  sortOrder: number;
}): SiteSectionDto {
  return {
    id: section.id,
    sectionKey: section.sectionKey as SiteSectionKey,
    displayName: section.displayName,
    isEnabled: section.isEnabled,
    sortOrder: section.sortOrder,
  };
}
