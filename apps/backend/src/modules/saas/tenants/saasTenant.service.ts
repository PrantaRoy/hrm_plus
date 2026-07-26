import { SaasTenantDto, UpdateSaasTenantInput } from "@hrm-plus/shared";
import { controlClient } from "../../../db/controlClient";
import { ApiError } from "../../../utils/ApiError";
import { tenantInclude, toSaasTenantDto } from "./saasTenant.mapper";

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
