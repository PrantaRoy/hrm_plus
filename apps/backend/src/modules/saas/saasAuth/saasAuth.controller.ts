import { RequestHandler } from "express";
import { saasLoginSchema } from "./saasAuth.schemas";
import * as saasAuthService from "./saasAuth.service";

export const saasLoginHandler: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = saasLoginSchema.parse(req.body);
    const result = await saasAuthService.login(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const saasMeHandler: RequestHandler = (req, res) => {
  res.json({ admin: req.saasAdmin });
};
