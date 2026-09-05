export const SAAS_CONTACT_STATUSES = ["UNREAD", "READ", "ARCHIVED"] as const;
export type SaasContactStatus = (typeof SAAS_CONTACT_STATUSES)[number];

export interface SaasContactSubmissionDto {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  subject: string | null;
  message: string;
  status: SaasContactStatus;
  ipAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitSaasContactInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
}

export interface UpdateSaasContactStatusInput {
  status: SaasContactStatus;
}

export interface ListSaasContactQuery {
  status?: SaasContactStatus;
}
