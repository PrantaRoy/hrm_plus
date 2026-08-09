import { PrismaClient } from "../../../generated/tenant";
import { CreateLegalPageInput, LegalPageDto, UpdateLegalPageInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { toLegalPageDto } from "./legalPage.mapper";

export async function listLegalPages(prisma: PrismaClient): Promise<LegalPageDto[]> {
  const pages = await prisma.legalPage.findMany({ orderBy: { title: "asc" } });
  return pages.map(toLegalPageDto);
}

export async function getLegalPageById(prisma: PrismaClient, id: number): Promise<LegalPageDto> {
  const page = await prisma.legalPage.findUnique({ where: { id } });
  if (!page) {
    throw ApiError.notFound("Legal page not found");
  }
  return toLegalPageDto(page);
}

export async function createLegalPage(prisma: PrismaClient, input: CreateLegalPageInput): Promise<LegalPageDto> {
  const existing = await prisma.legalPage.findUnique({ where: { slug: input.slug } });
  if (existing) {
    throw ApiError.conflict("A legal page with this slug already exists");
  }
  const created = await prisma.legalPage.create({ data: input });
  return toLegalPageDto(created);
}

async function getLegalPageOrThrow(prisma: PrismaClient, id: number) {
  const page = await prisma.legalPage.findUnique({ where: { id } });
  if (!page) {
    throw ApiError.notFound("Legal page not found");
  }
  return page;
}

export async function updateLegalPage(
  prisma: PrismaClient,
  id: number,
  input: UpdateLegalPageInput,
  updatedById: number
): Promise<LegalPageDto> {
  await getLegalPageOrThrow(prisma, id);
  const updated = await prisma.legalPage.update({ where: { id }, data: { ...input, updatedById } });
  return toLegalPageDto(updated);
}

export async function deleteLegalPage(prisma: PrismaClient, id: number): Promise<void> {
  await getLegalPageOrThrow(prisma, id);
  await prisma.legalPage.delete({ where: { id } });
}
