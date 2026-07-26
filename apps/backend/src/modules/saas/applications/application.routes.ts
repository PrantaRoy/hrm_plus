import { Router } from "express";
import { requireSaasAdmin } from "../saasAuth/saasAuth.middleware";
import { logoUpload } from "../../../middleware/upload";
import {
  approveApplicationHandler,
  getApplicationHandler,
  listApplicationsHandler,
  rejectApplicationHandler,
  submitApplicationHandler,
  updateApplicationHandler,
} from "./application.controller";

export const publicApplicationRouter = Router();
publicApplicationRouter.post("/", logoUpload.single("logo"), submitApplicationHandler);

export const adminApplicationRouter = Router();
adminApplicationRouter.use(requireSaasAdmin);
adminApplicationRouter.get("/", listApplicationsHandler);
adminApplicationRouter.get("/:id", getApplicationHandler);
adminApplicationRouter.patch("/:id", updateApplicationHandler);
adminApplicationRouter.post("/:id/approve", approveApplicationHandler);
adminApplicationRouter.post("/:id/reject", rejectApplicationHandler);
