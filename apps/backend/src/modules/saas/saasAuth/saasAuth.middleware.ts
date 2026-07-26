import { RequestHandler } from "express";
import { verifySaasAdminToken } from "./saasAuth.jwt";
import { ApiError } from "../../../utils/ApiError";

export const requireSaasAdmin: RequestHandler = (req, _res, next) => {
  const header = req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    next(ApiError.unauthorized("Missing access token"));
    return;
  }

  try {
    const payload = verifySaasAdminToken(token);
    req.saasAdmin = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired token"));
  }
};
