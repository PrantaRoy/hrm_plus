import { SaasLoginResponse } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function login(email: string, password: string): Promise<SaasLoginResponse> {
  const res = await apiClient.post<SaasLoginResponse>("/saas/admin/auth/login", { email, password });
  return res.data;
}
