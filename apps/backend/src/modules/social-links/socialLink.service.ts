import { PrismaClient } from "../../../generated/tenant";
import { CreateSocialLinkInput, SocialLinkDto, UpdateSocialLinkInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { toSocialLinkDto } from "./socialLink.mapper";

export async function listSocialLinks(prisma: PrismaClient): Promise<SocialLinkDto[]> {
  const links = await prisma.socialLink.findMany({ orderBy: { sortOrder: "asc" } });
  return links.map(toSocialLinkDto);
}

export async function createSocialLink(prisma: PrismaClient, input: CreateSocialLinkInput): Promise<SocialLinkDto> {
  const count = await prisma.socialLink.count();
  const created = await prisma.socialLink.create({
    data: {
      platform: input.platform,
      icon: input.icon,
      url: input.url,
      isActive: input.isActive ?? true,
      sortOrder: count,
    },
  });
  return toSocialLinkDto(created);
}

async function getSocialLinkOrThrow(prisma: PrismaClient, id: number) {
  const link = await prisma.socialLink.findUnique({ where: { id } });
  if (!link) {
    throw ApiError.notFound("Social link not found");
  }
  return link;
}

export async function updateSocialLink(
  prisma: PrismaClient,
  id: number,
  input: UpdateSocialLinkInput
): Promise<SocialLinkDto> {
  await getSocialLinkOrThrow(prisma, id);
  const updated = await prisma.socialLink.update({ where: { id }, data: input });
  return toSocialLinkDto(updated);
}

export async function deleteSocialLink(prisma: PrismaClient, id: number): Promise<void> {
  await getSocialLinkOrThrow(prisma, id);
  await prisma.socialLink.delete({ where: { id } });
}

export async function reorderSocialLinks(prisma: PrismaClient, orderedIds: number[]): Promise<SocialLinkDto[]> {
  const count = await prisma.socialLink.count({ where: { id: { in: orderedIds } } });
  if (count !== orderedIds.length) {
    throw ApiError.badRequest("orderedIds contains unknown social link ids");
  }
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.socialLink.update({ where: { id }, data: { sortOrder: index } }))
  );
  return listSocialLinks(prisma);
}
