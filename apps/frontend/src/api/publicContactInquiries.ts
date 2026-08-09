import axios from "axios";
import { ContactInquiryDto, SubmitContactInquiryInput, TENANT_HEADER } from "@hrm-plus/shared";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export async function submitPublicContactInquiry(
  tenantSlug: string,
  input: SubmitContactInquiryInput
): Promise<ContactInquiryDto> {
  const res = await axios.post<ContactInquiryDto>(`${baseURL}/public/contact-inquiries`, input, {
    headers: { [TENANT_HEADER]: tenantSlug },
  });
  return res.data;
}
