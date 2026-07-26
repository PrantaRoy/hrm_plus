import { RequestHandler } from "express";
import { CheckEmailResponse } from "@hrm-plus/shared";
import { changePasswordSchema, checkEmailSchema, loginSchema } from "./auth.schemas";
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
