import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { TenantApplicationDto } from "@hrm-plus/shared";
import { controlClient } from "../../../db/controlClient";
import { getTenantClient } from "../../../db/tenantClientPool";
import { tenantDatabaseUrl, tenantLoginUrl } from "../../../config/env";
import { ApiError } from "../../../utils/ApiError";
import {
  createTenantDatabase,
  runTenantMigrations,
  seedDefaultRoles,
} from "../../tenants/tenantProvisioning";
import { sendApplicationApprovedEmail } from "../../notifications/email.service";
import { applicationInclude, toApplicationDto } from "./application.mapper";

const DEFAULT_TENANT_ADMIN_PASSWORD = "12345678";

export async function approveApplication(applicationId: number): Promise<TenantApplicationDto> {
  const application = await controlClient.tenantApplication.findUnique({
    where: { id: applicationId },
    include: applicationInclude,
  });

  if (!application) {
    throw ApiError.notFound("Application not found");
  }
  if (application.status !== "Pending") {
    throw ApiError.conflict(`Application has already been ${application.status.toLowerCase()}`);
  }

  const databaseName = `hrm_tenant_${application.subdomainSlug.replace(/-/g, "_")}`;
  const startDate = new Date();
  const endDate = application.package.validityDays
    ? addDays(startDate, application.package.validityDays)
    : null;

  await createTenantDatabase(databaseName);
  runTenantMigrations(tenantDatabaseUrl(databaseName));

  const tenant = await controlClient.tenant.create({
    data: {
      name: application.companyName,
      slug: application.subdomainSlug,
      databaseName,
      status: "Active",
      packageId: application.packageId,
      applicationId: application.id,
      companyType: application.companyType,
      overview: application.overview,
      numberOfEmployees: application.numberOfEmployees,
      companyLogoUrl: application.companyLogoUrl,
      contactEmail: application.contactEmail,
      startDate,
      endDate,
    },
  });

  const tenantClient = getTenantClient(databaseName);
  const roleIds = await seedDefaultRoles(tenantClient);
  const passwordHash = await bcrypt.hash(DEFAULT_TENANT_ADMIN_PASSWORD, 10);

  const adminUser = await tenantClient.user.create({
    data: {
      email: application.contactEmail,
      passwordHash,
      roleId: roleIds.Admin,
      mustChangePassword: true,
    },
  });

  await tenantClient.employee.create({
    data: {
      employeeCode: `EMP-${nanoid(6).toUpperCase()}`,
      firstName: application.companyName,
      lastName: "Admin",
      email: application.contactEmail,
      joiningDate: startDate,
      userId: adminUser.id,
    },
  });

  const updatedApplication = await controlClient.tenantApplication.update({
    where: { id: application.id },
    data: { status: "Approved", reviewedAt: new Date() },
    include: applicationInclude,
  });

  await sendApplicationApprovedEmail(
    application.contactEmail,
    application.companyName,
    tenantLoginUrl(tenant.slug),
    DEFAULT_TENANT_ADMIN_PASSWORD
  );

  return toApplicationDto(updatedApplication);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
