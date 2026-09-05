import { SaasContactStatus, SaasContactSubmissionDto } from "@hrm-plus/shared";
import { SaasContactSubmission } from "../../../../generated/control";

export function toSaasContactSubmissionDto(s: SaasContactSubmission): SaasContactSubmissionDto {
  return {
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    company: s.company,
    subject: s.subject,
    message: s.message,
    status: s.status as SaasContactStatus,
    ipAddress: s.ipAddress,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}
