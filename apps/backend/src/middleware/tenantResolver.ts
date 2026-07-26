import { RequestHandler } from "express";
import { TENANT_HEADER } from "@hrm-plus/shared";
import { controlClient } from "../db/controlClient";
import { getTenantClient } from "../db/tenantClientPool";
import { ApiError } from "../utils/ApiError";

export const tenantResolver: RequestHandler = async (req, res, next) => {
  try {
    const slugHeader = req.header(TENANT_HEADER);
    const slug = slugHeader ?? subdomainSlug(req.hostname);

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

function subdomainSlug(hostname: string): string | null {
  const parts = hostname.split(".");
  if (parts.length < 3) return null;
  return parts[0];
}
