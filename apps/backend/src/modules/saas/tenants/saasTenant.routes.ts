import { Router } from "express";
import { requireSaasAdmin } from "../saasAuth/saasAuth.middleware";
import { logoUpload } from "../../../middleware/upload";
import {
  createSaasTenantHandler,
  listSaasTenantsHandler,
  toggleSaasTenantStatusHandler,
  updateSaasTenantHandler,
} from "./saasTenant.controller";

export const saasTenantRouter = Router();
saasTenantRouter.use(requireSaasAdmin);

saasTenantRouter.get("/", listSaasTenantsHandler);
saasTenantRouter.post("/", logoUpload.single("logo"), createSaasTenantHandler);
saasTenantRouter.patch("/:id", updateSaasTenantHandler);
saasTenantRouter.post("/:id/toggle-status", toggleSaasTenantStatusHandler);
