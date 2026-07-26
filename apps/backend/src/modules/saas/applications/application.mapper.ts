import { Prisma } from "../../../../generated/control";
import { TenantApplicationDto } from "@hrm-plus/shared";

const applicationWithPackage = Prisma.validator<Prisma.TenantApplicationDefaultArgs>()({
  include: { package: true },
});

export type ApplicationWithPackage = Prisma.TenantApplicationGetPayload<typeof applicationWithPackage>;

export const applicationInclude = applicationWithPackage.include;

export function toApplicationDto(application: ApplicationWithPackage): TenantApplicationDto {
  return {
    id: application.id,
    companyName: application.companyName,
    companyLogoUrl: application.companyLogoUrl,
    companyType: application.companyType,
    overview: application.overview,
    numberOfEmployees: application.numberOfEmployees,
    contactEmail: application.contactEmail,
    subdomainSlug: application.subdomainSlug,
    packageId: application.packageId,
    packageName: application.package.name,
    status: application.status as TenantApplicationDto["status"],
    reviewNote: application.reviewNote,
    submittedAt: application.submittedAt.toISOString(),
    reviewedAt: application.reviewedAt?.toISOString() ?? null,
  };
}
