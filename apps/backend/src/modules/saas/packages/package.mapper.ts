import { Package } from "../../../../generated/control";
import { PackageDto } from "@hrm-plus/shared";

export function toPackageDto(pkg: Package): PackageDto {
  return {
    id: pkg.id,
    name: pkg.name,
    price: Number(pkg.price),
    validityDays: pkg.validityDays,
    isActive: pkg.isActive,
    createdAt: pkg.createdAt.toISOString(),
    description: pkg.description,
    features: Array.isArray(pkg.features) ? (pkg.features as string[]) : [],
    isPopular: pkg.isPopular,
    billingPeriod: pkg.billingPeriod,
    ctaLabel: pkg.ctaLabel,
    sortOrder: pkg.sortOrder,
  };
}
