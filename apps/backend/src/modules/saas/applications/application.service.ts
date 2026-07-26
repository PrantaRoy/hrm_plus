import { SubmitApplicationInput, TenantApplicationDto, UpdateApplicationInput } from "@hrm-plus/shared";
import { controlClient } from "../../../db/controlClient";
import { ApiError } from "../../../utils/ApiError";
import { sendApplicationPendingEmail, sendApplicationRejectedEmail } from "../../notifications/email.service";
import { applicationInclude, toApplicationDto } from "./application.mapper";

async function assertSlugAvailable(slug: string): Promise<void> {
  const [existingTenant, existingApplication] = await Promise.all([
    controlClient.tenant.findUnique({ where: { slug } }),
    controlClient.tenantApplication.findUnique({ where: { subdomainSlug: slug } }),
  ]);

  if (existingTenant || existingApplication) {
    throw ApiError.conflict(`Subdomain "${slug}" is already taken`);
  }
}

export async function submitApplication(
  input: SubmitApplicationInput,
  companyLogoUrl: string | null
): Promise<TenantApplicationDto> {
  const pkg = await controlClient.package.findUnique({ where: { id: input.packageId } });
  if (!pkg || !pkg.isActive) {
    throw ApiError.badRequest("Selected package is not available");
  }

  await assertSlugAvailable(input.subdomainSlug);

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
    include: applicationInclude,
  });

  await sendApplicationPendingEmail(application.contactEmail, application.companyName);

  return toApplicationDto(application);
}

export async function listApplications(status?: string): Promise<TenantApplicationDto[]> {
  const applications = await controlClient.tenantApplication.findMany({
    where: status ? { status } : undefined,
    include: applicationInclude,
    orderBy: { submittedAt: "desc" },
  });
  return applications.map(toApplicationDto);
}

export async function getApplicationById(id: number): Promise<TenantApplicationDto> {
  const application = await controlClient.tenantApplication.findUnique({
    where: { id },
    include: applicationInclude,
  });
  if (!application) {
    throw ApiError.notFound("Application not found");
  }
  return toApplicationDto(application);
}

async function getPendingApplicationOrThrow(id: number) {
  const application = await controlClient.tenantApplication.findUnique({ where: { id } });
  if (!application) {
    throw ApiError.notFound("Application not found");
  }
  if (application.status !== "Pending") {
    throw ApiError.conflict(`Application has already been ${application.status.toLowerCase()}`);
  }
  return application;
}

export async function updateApplication(
  id: number,
  input: UpdateApplicationInput
): Promise<TenantApplicationDto> {
  await getPendingApplicationOrThrow(id);

  if (input.packageId) {
    const pkg = await controlClient.package.findUnique({ where: { id: input.packageId } });
    if (!pkg || !pkg.isActive) {
      throw ApiError.badRequest("Selected package is not available");
    }
  }

  const application = await controlClient.tenantApplication.update({
    where: { id },
    data: {
      companyName: input.companyName,
      companyType: input.companyType,
      overview: input.overview,
      numberOfEmployees: input.numberOfEmployees,
      contactEmail: input.contactEmail,
      packageId: input.packageId,
    },
    include: applicationInclude,
  });

  return toApplicationDto(application);
}

export async function rejectApplication(id: number, reviewNote?: string): Promise<TenantApplicationDto> {
  const existing = await getPendingApplicationOrThrow(id);

  const application = await controlClient.tenantApplication.update({
    where: { id },
    data: { status: "Rejected", reviewNote, reviewedAt: new Date() },
    include: applicationInclude,
  });

  await sendApplicationRejectedEmail(existing.contactEmail, existing.companyName, reviewNote);

  return toApplicationDto(application);
}
