import { RoleName } from "./roles";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleName;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
  tenantSlug: string;
  mustChangePassword: boolean;
}

export interface CheckEmailResponse {
  exists: boolean;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyTenantResponse {
  tenantName: string;
}

export interface RequestPasswordResetInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface JwtAccessPayload {
  sub: number;
  tenantSlug: string;
  role: RoleName;
  email: string;
}
