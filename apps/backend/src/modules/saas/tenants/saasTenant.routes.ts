import { Router } from "express";
import { requireSaasAdmin } from "../saasAuth/saasAuth.middleware";
import {
  listSaasTenantsHandler,
  toggleSaasTenantStatusHandler,
  updateSaasTenantHandler,
} from "./saasTenant.controller";

export const saasTenantRouter = Router();
saasTenantRouter.use(requireSaasAdmin);

saasTenantRouter.get("/", listSaasTenantsHandler);
saasTenantRouter.patch("/:id", updateSaasTenantHandler);
saasTenantRouter.post("/:id/toggle-status", toggleSaasTenantStatusHandler);
