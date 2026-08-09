export const CONTACT_INQUIRY_STATUSES = ["UNREAD", "READ", "ARCHIVED"] as const;
export type ContactInquiryStatus = (typeof CONTACT_INQUIRY_STATUSES)[number];

export interface ContactInquiryDto {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: ContactInquiryStatus;
  ipAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitContactInquiryInput {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export interface UpdateContactInquiryStatusInput {
  status: ContactInquiryStatus;
}

export interface ListContactInquiriesQuery {
  status?: ContactInquiryStatus;
}
