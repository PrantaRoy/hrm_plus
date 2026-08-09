import { PrismaClient } from "../../../generated/tenant";
import { CompanyServiceDto, CreateCompanyServiceInput, UpdateCompanyServiceInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { toCompanyServiceDto } from "./companyService.mapper";

export async function listCompanyServices(prisma: PrismaClient): Promise<CompanyServiceDto[]> {
  const services = await prisma.companyService.findMany({ orderBy: { sortOrder: "asc" } });
  return services.map(toCompanyServiceDto);
}

export async function getCompanyServiceById(prisma: PrismaClient, id: number): Promise<CompanyServiceDto> {
  const service = await prisma.companyService.findUnique({ where: { id } });
  if (!service) {
    throw ApiError.notFound("Service not found");
  }
  return toCompanyServiceDto(service);
}

export async function createCompanyService(
  prisma: PrismaClient,
  input: CreateCompanyServiceInput
): Promise<CompanyServiceDto> {
  const count = await prisma.companyService.count();
  const created = await prisma.companyService.create({
    data: {
      icon: input.icon,
      title: input.title,
      summary: input.summary,
      description: input.description,
      isActive: input.isActive ?? true,
      sortOrder: count,
    },
  });
  return toCompanyServiceDto(created);
}

async function getCompanyServiceOrThrow(prisma: PrismaClient, id: number) {
  const service = await prisma.companyService.findUnique({ where: { id } });
  if (!service) {
    throw ApiError.notFound("Service not found");
  }
  return service;
}

export async function updateCompanyService(
  prisma: PrismaClient,
  id: number,
  input: UpdateCompanyServiceInput
): Promise<CompanyServiceDto> {
  await getCompanyServiceOrThrow(prisma, id);
  const updated = await prisma.companyService.update({ where: { id }, data: input });
  return toCompanyServiceDto(updated);
}

export async function deleteCompanyService(prisma: PrismaClient, id: number): Promise<void> {
  await getCompanyServiceOrThrow(prisma, id);
  await prisma.companyService.delete({ where: { id } });
}

export async function reorderCompanyServices(
  prisma: PrismaClient,
  orderedIds: number[]
): Promise<CompanyServiceDto[]> {
  const count = await prisma.companyService.count({ where: { id: { in: orderedIds } } });
  if (count !== orderedIds.length) {
    throw ApiError.badRequest("orderedIds contains unknown service ids");
  }
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.companyService.update({ where: { id }, data: { sortOrder: index } }))
  );
  return listCompanyServices(prisma);
}
