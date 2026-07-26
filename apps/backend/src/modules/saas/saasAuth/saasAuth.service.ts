import bcrypt from "bcrypt";
import { SaasLoginResponse } from "@hrm-plus/shared";
import { controlClient } from "../../../db/controlClient";
import { ApiError } from "../../../utils/ApiError";
import { signSaasAdminToken } from "./saasAuth.jwt";

export async function login(email: string, password: string): Promise<SaasLoginResponse> {
  const admin = await controlClient.platformAdmin.findUnique({ where: { email } });

  if (!admin) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const matches = await bcrypt.compare(password, admin.passwordHash);
  if (!matches) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const accessToken = signSaasAdminToken({ sub: admin.id, email: admin.email });

  return { accessToken, admin: { id: admin.id, email: admin.email } };
}
