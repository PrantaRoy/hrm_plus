import { RequestHandler } from "express";
import { loginSchema } from "./auth.schemas";
import * as authService from "./auth.service";

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
