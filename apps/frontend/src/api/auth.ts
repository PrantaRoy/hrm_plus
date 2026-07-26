import { ChangePasswordInput, CheckEmailResponse, LoginResponse, TENANT_HEADER } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function checkEmail(tenantSlug: string, email: string): Promise<CheckEmailResponse> {
  const res = await apiClient.post<CheckEmailResponse>(
    "/auth/check-email",
    { email },
    { headers: { [TENANT_HEADER]: tenantSlug } }
  );
  return res.data;
}

export async function login(tenantSlug: string, email: string, password: string): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>(
    "/auth/login",
    { email, password },
    { headers: { [TENANT_HEADER]: tenantSlug } }
  );
  return res.data;
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await apiClient.post("/auth/change-password", input);
}
