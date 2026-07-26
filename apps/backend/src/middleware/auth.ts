import { RequestHandler } from "express";
import { RoleName } from "@hrm-plus/shared";
import { verifyAccessToken } from "../modules/auth/jwt";
import { ApiError } from "../utils/ApiError";

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    next(ApiError.unauthorized("Missing access token"));
    return;
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    next(ApiError.unauthorized("Invalid or expired token"));
    return;
  }

  if (!req.tenant || payload.tenantSlug !== req.tenant.slug) {
    next(ApiError.unauthorized("Token does not match tenant"));
    return;
  }

  req.user = { id: payload.sub, email: payload.email, role: payload.role };
  next();
};

export function requireRole(...roles: RoleName[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden(`Requires role: ${roles.join(", ")}`));
      return;
    }
    next();
  };
}
