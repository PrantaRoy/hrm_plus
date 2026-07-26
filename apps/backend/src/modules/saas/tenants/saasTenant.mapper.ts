import { Prisma } from "../../../../generated/control";
import { SaasTenantDto } from "@hrm-plus/shared";

const tenantWithPackage = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: { package: true },
});

export type TenantWithPackage = Prisma.TenantGetPayload<typeof tenantWithPackage>;

export const tenantInclude = tenantWithPackage.include;

export function toSaasTenantDto(tenant: TenantWithPackage): SaasTenantDto {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status as SaasTenantDto["status"],
    packageId: tenant.packageId,
    packageName: tenant.package?.name ?? null,
    companyType: tenant.companyType,
    overview: tenant.overview,
    numberOfEmployees: tenant.numberOfEmployees,
    companyLogoUrl: tenant.companyLogoUrl,
    contactEmail: tenant.contactEmail,
    startDate: tenant.startDate.toISOString(),
    endDate: tenant.endDate?.toISOString() ?? null,
    createdAt: tenant.createdAt.toISOString(),
  };
}
