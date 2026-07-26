import jwt, { SignOptions } from "jsonwebtoken";
import { JwtAccessPayload } from "@hrm-plus/shared";
import { env } from "../../config/env";

export function signAccessToken(payload: JwtAccessPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_ACCESS_TTL as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as unknown as JwtAccessPayload;
}

export function signRefreshToken(payload: { sub: number; tenantSlug: string }): string {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_TTL as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyRefreshToken(token: string): { sub: number; tenantSlug: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as unknown as { sub: number; tenantSlug: string };
}
