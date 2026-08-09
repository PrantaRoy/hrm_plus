import axios from "axios";
import { PublicSiteContentDto, TENANT_HEADER } from "@hrm-plus/shared";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export async function fetchPublicSiteContent(tenantSlug: string): Promise<PublicSiteContentDto> {
  const res = await axios.get<PublicSiteContentDto>(`${baseURL}/public/site-content`, {
    headers: { [TENANT_HEADER]: tenantSlug },
  });
  return res.data;
}
