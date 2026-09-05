import { CreatePackageInput, PackageDto, UpdatePackageInput } from "@hrm-plus/shared";
import { Prisma } from "../../../../generated/control";
import { controlClient } from "../../../db/controlClient";
import { ApiError } from "../../../utils/ApiError";
import { toPackageDto } from "./package.mapper";
import { invalidateLandingCache } from "../landing/saasLandingContent.service";

export async function listPackages(onlyActive: boolean): Promise<PackageDto[]> {
  const packages = await controlClient.package.findMany({
    where: onlyActive ? { isActive: true } : undefined,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return packages.map(toPackageDto);
}

function buildWriteData(
  input: CreatePackageInput | UpdatePackageInput
): Prisma.PackageUncheckedCreateInput | Prisma.PackageUncheckedUpdateInput {
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.price !== undefined) data.price = input.price;
  if (input.validityDays !== undefined) data.validityDays = input.validityDays;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.description !== undefined) data.description = input.description;
  if (input.features !== undefined) data.features = input.features as Prisma.InputJsonValue;
  if (input.isPopular !== undefined) data.isPopular = input.isPopular;
  if (input.billingPeriod !== undefined) data.billingPeriod = input.billingPeriod;
  if (input.ctaLabel !== undefined) data.ctaLabel = input.ctaLabel;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
  return data;
}

export async function createPackage(input: CreatePackageInput): Promise<PackageDto> {
  const pkg = await controlClient.package.create({
    data: {
      name: input.name,
      price: input.price,
      validityDays: input.validityDays,
      isActive: input.isActive ?? true,
      ...buildWriteData(input),
    } as Prisma.PackageUncheckedCreateInput,
  });
  invalidateLandingCache();
  return toPackageDto(pkg);
}

export async function updatePackage(id: number, input: UpdatePackageInput): Promise<PackageDto> {
  const existing = await controlClient.package.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Package not found");
  }

  const pkg = await controlClient.package.update({
    where: { id },
    data: buildWriteData(input) as Prisma.PackageUncheckedUpdateInput,
  });
  invalidateLandingCache();
  return toPackageDto(pkg);
}

export async function deletePackage(id: number): Promise<void> {
  const existing = await controlClient.package.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Package not found");
  }

  const inUse = await controlClient.tenant.count({ where: { packageId: id } });
  if (inUse > 0) {
    throw ApiError.conflict("Package is in use by existing tenants and cannot be deleted");
  }

  await controlClient.package.delete({ where: { id } });
  invalidateLandingCache();
}
