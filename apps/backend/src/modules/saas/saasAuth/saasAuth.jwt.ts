import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../../../config/env";

export interface SaasAdminJwtPayload {
  sub: number;
  email: string;
  scope: "saas-admin";
}

export function signSaasAdminToken(payload: Omit<SaasAdminJwtPayload, "scope">): string {
  const options: SignOptions = { expiresIn: env.JWT_SAAS_ACCESS_TTL as SignOptions["expiresIn"] };
  return jwt.sign({ ...payload, scope: "saas-admin" }, env.JWT_SAAS_ACCESS_SECRET, options);
}

export function verifySaasAdminToken(token: string): SaasAdminJwtPayload {
  const payload = jwt.verify(token, env.JWT_SAAS_ACCESS_SECRET) as unknown as SaasAdminJwtPayload;
  if (payload.scope !== "saas-admin") {
    throw new Error("Invalid token scope");
  }
  return payload;
}
