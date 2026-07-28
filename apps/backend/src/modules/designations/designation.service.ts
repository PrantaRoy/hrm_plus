import { PrismaClient } from "../../../generated/tenant";
import { CreateDesignationInput, DesignationDto, UpdateDesignationInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";

function toDesignationDto(designation: {
  id: number;
  name: string;
  status: string;
  shortDescription: string | null;
}): DesignationDto {
  return {
    id: designation.id,
    name: designation.name,
    status: designation.status as DesignationDto["status"],
    shortDescription: designation.shortDescription,
  };
}

export async function listDesignations(prisma: PrismaClient): Promise<DesignationDto[]> {
  const designations = await prisma.designation.findMany({ orderBy: { name: "asc" } });
  return designations.map(toDesignationDto);
}

export async function getDesignationById(prisma: PrismaClient, id: number): Promise<DesignationDto> {
  const designation = await prisma.designation.findUnique({ where: { id } });
  if (!designation) {
    throw ApiError.notFound("Designation not found");
  }
  return toDesignationDto(designation);
}

export async function createDesignation(
  prisma: PrismaClient,
  input: CreateDesignationInput
): Promise<DesignationDto> {
  const designation = await prisma.designation.create({
    data: {
      name: input.name,
      status: input.status ?? "Active",
      shortDescription: input.shortDescription ?? null,
    },
  });
  return toDesignationDto(designation);
}

export async function updateDesignation(
  prisma: PrismaClient,
  id: number,
  input: UpdateDesignationInput
): Promise<DesignationDto> {
  const existing = await prisma.designation.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Designation not found");
  }

  const designation = await prisma.designation.update({
    where: { id },
    data: {
      name: input.name,
      status: input.status,
      shortDescription: input.shortDescription,
    },
  });
  return toDesignationDto(designation);
}

export async function deleteDesignation(prisma: PrismaClient, id: number): Promise<void> {
  const existing = await prisma.designation.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Designation not found");
  }
  await prisma.designation.delete({ where: { id } });
}
