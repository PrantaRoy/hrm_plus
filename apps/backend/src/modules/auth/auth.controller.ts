import { RequestHandler } from "express";
import { CheckEmailResponse, VerifyTenantResponse } from "@hrm-plus/shared";
import { env } from "../../config/env";
import { controlClient } from "../../db/controlClient";
import {
  changePasswordSchema,
  checkEmailSchema,
  loginSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "./auth.schemas";
import * as authService from "./auth.service";

export const checkEmailHandler: RequestHandler = async (req, res, next) => {
  try {
    const { email } = checkEmailSchema.parse(req.body);
    const exists = await authService.checkEmailExists(req.prisma!, email);
    const response: CheckEmailResponse = { exists };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const loginHandler: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await authService.login(req.prisma!, req.tenant!.slug, email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const verifyTenantHandler: RequestHandler = async (req, res, next) => {
  try {
    const tenant = await controlClient.tenant.findUnique({ where: { id: req.tenant!.id } });
    const response: VerifyTenantResponse = { tenantName: tenant?.name ?? req.tenant!.slug };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const requestPasswordResetHandler: RequestHandler = async (req, res, next) => {
  try {
    const { email } = requestPasswordResetSchema.parse(req.body);
    const tenantSlug = req.tenant!.slug;
    await authService.requestPasswordReset(
      req.prisma!,
      email,
      (token) => `${env.FRONTEND_BASE_URL}/reset-password?token=${token}&slug=${tenantSlug}`
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const resetPasswordHandler: RequestHandler = async (req, res, next) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(req.prisma!, token, newPassword);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const meHandler: RequestHandler = (req, res) => {
  res.json({ user: req.user });
};

export const changePasswordHandler: RequestHandler = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await authService.changePassword(req.prisma!, req.user!.id, currentPassword, newPassword);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
