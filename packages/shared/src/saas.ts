export interface PackageDto {
  id: number;
  name: string;
  price: number;
  validityDays: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreatePackageInput {
  name: string;
  price: number;
  validityDays: number | null;
  isActive?: boolean;
}

export type UpdatePackageInput = Partial<CreatePackageInput>;

export type ApplicationStatus = "Pending" | "Approved" | "Rejected";

export interface TenantApplicationDto {
  id: number;
  companyName: string;
  companyLogoUrl: string | null;
  companyType: string;
  overview: string;
  numberOfEmployees: number;
  contactEmail: string;
  subdomainSlug: string;
  packageId: number;
  packageName: string;
  status: ApplicationStatus;
  reviewNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface SubmitApplicationInput {
  companyName: string;
  companyType: string;
  overview: string;
  numberOfEmployees: number;
  contactEmail: string;
  subdomainSlug: string;
  packageId: number;
}

export interface UpdateApplicationInput {
  companyName?: string;
  companyType?: string;
  overview?: string;
  numberOfEmployees?: number;
  contactEmail?: string;
  packageId?: number;
}

export interface ReviewApplicationInput {
  reviewNote?: string;
}

export type SaasTenantStatus = "Active" | "Inactive";

export interface SaasTenantDto {
  id: number;
  name: string;
  slug: string;
  status: SaasTenantStatus;
  packageId: number | null;
  packageName: string | null;
  companyType: string | null;
  overview: string | null;
  numberOfEmployees: number | null;
  companyLogoUrl: string | null;
  contactEmail: string | null;
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

export interface UpdateSaasTenantInput {
  name?: string;
  companyType?: string;
  overview?: string;
  numberOfEmployees?: number;
  contactEmail?: string;
}

export interface SaasStats {
  totalCompanies: number;
  totalPackages: number;
}

export interface SaasAdminUser {
  id: number;
  email: string;
}

export interface SaasLoginResponse {
  accessToken: string;
  admin: SaasAdminUser;
}
