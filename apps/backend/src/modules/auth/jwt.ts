import jwt from "jsonwebtoken";
import { JwtAccessPayload } from "@hrm-plus/shared";
import { env } from "../../config/env";

export function signAccessToken(payload: JwtAccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL });
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;
}

export function signRefreshToken(payload: { sub: number; tenantSlug: string }): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_TTL });
}

export function verifyRefreshToken(token: string): { sub: number; tenantSlug: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: number; tenantSlug: string };
}
