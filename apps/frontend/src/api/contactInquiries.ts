import { ContactInquiryDto, ContactInquiryStatus, ListContactInquiriesQuery } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listContactInquiries(params: ListContactInquiriesQuery = {}): Promise<ContactInquiryDto[]> {
  const res = await apiClient.get<ContactInquiryDto[]>("/contact-inquiries", { params });
  return res.data;
}

export async function updateContactInquiryStatus(
  id: number,
  status: ContactInquiryStatus
): Promise<ContactInquiryDto> {
  const res = await apiClient.patch<ContactInquiryDto>(`/contact-inquiries/${id}/status`, { status });
  return res.data;
}

export async function deleteContactInquiry(id: number): Promise<void> {
  await apiClient.delete(`/contact-inquiries/${id}`);
}
