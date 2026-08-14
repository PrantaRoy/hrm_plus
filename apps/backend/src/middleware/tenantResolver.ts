import { RequestHandler } from "express";
import { extractTenantSlug, TENANT_HEADER } from "@hrm-plus/shared";
import { env } from "../config/env";
import { controlClient } from "../db/controlClient";
import { getTenantClient } from "../db/tenantClientPool";
import { ApiError } from "../utils/ApiError";

export const tenantResolver: RequestHandler = async (req, res, next) => {
  try {
    const slugHeader = req.header(TENANT_HEADER);
    const slug = slugHeader ?? extractTenantSlug(req.hostname, env.PUBLIC_TENANT_BASE_DOMAIN);

    if (!slug) {
      throw ApiError.badRequest(`Missing tenant (send ${TENANT_HEADER} header)`, "TENANT_REQUIRED");
    }

    const tenant = await controlClient.tenant.findUnique({ where: { slug } });

    if (!tenant || tenant.status !== "Active") {
      throw ApiError.notFound("Tenant not found");
    }

    req.tenant = { id: tenant.id, slug: tenant.slug, databaseName: tenant.databaseName };
    req.prisma = getTenantClient(tenant.databaseName);
    next();
  } catch (err) {
    next(err);
  }
};
