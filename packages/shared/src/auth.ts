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
}

export interface JwtAccessPayload {
  sub: number;
  tenantSlug: string;
  role: RoleName;
  email: string;
}
