import { ContactInquiryDto, ContactInquiryStatus } from "@hrm-plus/shared";

export function toContactInquiryDto(inquiry: {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  ipAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ContactInquiryDto {
  return {
    id: inquiry.id,
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone,
    subject: inquiry.subject,
    message: inquiry.message,
    status: inquiry.status as ContactInquiryStatus,
    ipAddress: inquiry.ipAddress,
    createdAt: inquiry.createdAt.toISOString(),
    updatedAt: inquiry.updatedAt.toISOString(),
  };
}
