import { SaasTenantDto, SubmitApplicationInput, UpdateSaasTenantInput } from "@hrm-plus/shared";
import { controlClient } from "../../../db/controlClient";
import { ApiError } from "../../../utils/ApiError";
import { assertSlugAvailable } from "../applications/application.service";
import { approveApplication } from "../applications/approvalService";
import { tenantInclude, toSaasTenantDto } from "./saasTenant.mapper";

export async function createTenantByAdmin(
  input: SubmitApplicationInput & { seedDemoData?: boolean },
  companyLogoUrl: string | null
): Promise<SaasTenantDto> {
  const pkg = await controlClient.package.findUnique({ where: { id: input.packageId } });
  if (!pkg || !pkg.isActive) {
    throw ApiError.badRequest("Selected package is not available");
  }

  await assertSlugAvailable(input.subdomainSlug);

  // SaaS-admin-created companies skip the review queue: we still record a
  // TenantApplication (so provisioning has a single source of truth) but
  // immediately run the same approval path, which provisions the tenant
  // database, seeds it, and emails the admin their login + password.
  const application = await controlClient.tenantApplication.create({
    data: {
      companyName: input.companyName,
      companyType: input.companyType,
      overview: input.overview,
      numberOfEmployees: input.numberOfEmployees,
      contactEmail: input.contactEmail,
      subdomainSlug: input.subdomainSlug,
      packageId: input.packageId,
      companyLogoUrl,
      status: "Pending",
    },
  });

  await approveApplication(application.id, { seedDemoData: input.seedDemoData });

  const tenant = await controlClient.tenant.findUnique({
    where: { applicationId: application.id },
    include: tenantInclude,
  });
  if (!tenant) {
    throw new Error("Tenant provisioning did not produce a tenant record");
  }

  return toSaasTenantDto(tenant);
}

export async function listSaasTenants(): Promise<SaasTenantDto[]> {
  const tenants = await controlClient.tenant.findMany({
    include: tenantInclude,
    orderBy: { createdAt: "desc" },
  });
  return tenants.map(toSaasTenantDto);
}

export async function updateSaasTenant(id: number, input: UpdateSaasTenantInput): Promise<SaasTenantDto> {
  const existing = await controlClient.tenant.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Tenant not found");
  }

  const tenant = await controlClient.tenant.update({
    where: { id },
    data: {
      name: input.name,
      companyType: input.companyType,
      overview: input.overview,
      numberOfEmployees: input.numberOfEmployees,
      contactEmail: input.contactEmail,
    },
    include: tenantInclude,
  });

  return toSaasTenantDto(tenant);
}

export async function toggleTenantStatus(id: number): Promise<SaasTenantDto> {
  const existing = await controlClient.tenant.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Tenant not found");
  }

  const nextStatus = existing.status === "Active" ? "Inactive" : "Active";

  const tenant = await controlClient.tenant.update({
    where: { id },
    data: { status: nextStatus },
    include: tenantInclude,
  });

  return toSaasTenantDto(tenant);
}
