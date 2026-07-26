import { LoginResponse, TENANT_HEADER } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function login(tenantSlug: string, email: string, password: string): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>(
    "/auth/login",
    { email, password },
    { headers: { [TENANT_HEADER]: tenantSlug } }
  );
  return res.data;
}
