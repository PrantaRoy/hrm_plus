import { PrismaClient } from "../../../generated/tenant";
import { SiteSectionDto } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { toSiteSectionDto } from "./siteSection.mapper";

const DEFAULT_SECTIONS: { sectionKey: string; displayName: string }[] = [
  { sectionKey: "hero", displayName: "Hero" },
  { sectionKey: "about", displayName: "About Us" },
  { sectionKey: "overview", displayName: "Our Services" },
  { sectionKey: "gallery", displayName: "Gallery" },
  { sectionKey: "careers", displayName: "Careers" },
  { sectionKey: "blogs", displayName: "Blog" },
  { sectionKey: "contact", displayName: "Contact Us" },
];

export async function seedDefaultSiteSections(prisma: PrismaClient): Promise<void> {
  const count = await prisma.siteSection.count();
  if (count > 0) return;
  await prisma.siteSection.createMany({
    data: DEFAULT_SECTIONS.map((section, index) => ({
      sectionKey: section.sectionKey,
      displayName: section.displayName,
      isEnabled: true,
      sortOrder: index,
    })),
  });
}

export async function listSections(prisma: PrismaClient): Promise<SiteSectionDto[]> {
  await seedDefaultSiteSections(prisma);
  const sections = await prisma.siteSection.findMany({ orderBy: { sortOrder: "asc" } });
  return sections.map(toSiteSectionDto);
}

export async function updateSection(
  prisma: PrismaClient,
  id: number,
  input: { displayName?: string; isEnabled?: boolean }
): Promise<SiteSectionDto> {
  const existing = await prisma.siteSection.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Site section not found");
  }
  const updated = await prisma.siteSection.update({ where: { id }, data: input });
  return toSiteSectionDto(updated);
}

export async function reorderSections(prisma: PrismaClient, orderedIds: number[]): Promise<SiteSectionDto[]> {
  const count = await prisma.siteSection.count({ where: { id: { in: orderedIds } } });
  if (count !== orderedIds.length) {
    throw ApiError.badRequest("orderedIds contains unknown section ids");
  }
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.siteSection.update({ where: { id }, data: { sortOrder: index } }))
  );
  const sections = await prisma.siteSection.findMany({ orderBy: { sortOrder: "asc" } });
  return sections.map(toSiteSectionDto);
}
