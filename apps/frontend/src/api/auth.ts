import {
  ChangePasswordInput,
  CheckEmailResponse,
  LoginResponse,
  TENANT_HEADER,
  VerifyTenantResponse,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function checkEmail(tenantSlug: string, email: string): Promise<CheckEmailResponse> {
  const res = await apiClient.post<CheckEmailResponse>(
    "/auth/check-email",
    { email },
    { headers: { [TENANT_HEADER]: tenantSlug } }
  );
  return res.data;
}

export async function verifyTenant(tenantSlug: string): Promise<VerifyTenantResponse> {
  const res = await apiClient.post<VerifyTenantResponse>(
    "/auth/verify-tenant",
    {},
    { headers: { [TENANT_HEADER]: tenantSlug } }
  );
  return res.data;
}

export async function requestPasswordReset(tenantSlug: string, email: string): Promise<void> {
  await apiClient.post(
    "/auth/forgot-password",
    { email },
    { headers: { [TENANT_HEADER]: tenantSlug } }
  );
}

export async function resetPassword(tenantSlug: string, token: string, newPassword: string): Promise<void> {
  await apiClient.post(
    "/auth/reset-password",
    { token, newPassword },
    { headers: { [TENANT_HEADER]: tenantSlug } }
  );
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
