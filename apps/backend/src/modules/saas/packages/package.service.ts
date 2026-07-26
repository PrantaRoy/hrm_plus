import { CreatePackageInput, PackageDto, UpdatePackageInput } from "@hrm-plus/shared";
import { controlClient } from "../../../db/controlClient";
import { ApiError } from "../../../utils/ApiError";
import { toPackageDto } from "./package.mapper";

export async function listPackages(onlyActive: boolean): Promise<PackageDto[]> {
  const packages = await controlClient.package.findMany({
    where: onlyActive ? { isActive: true } : undefined,
    orderBy: { createdAt: "asc" },
  });
  return packages.map(toPackageDto);
}

export async function createPackage(input: CreatePackageInput): Promise<PackageDto> {
  const pkg = await controlClient.package.create({
    data: {
      name: input.name,
      price: input.price,
      validityDays: input.validityDays,
      isActive: input.isActive ?? true,
    },
  });
  return toPackageDto(pkg);
}

export async function updatePackage(id: number, input: UpdatePackageInput): Promise<PackageDto> {
  const existing = await controlClient.package.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Package not found");
  }

  const pkg = await controlClient.package.update({
    where: { id },
    data: {
      name: input.name,
      price: input.price,
      validityDays: input.validityDays,
      isActive: input.isActive,
    },
  });
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
}
