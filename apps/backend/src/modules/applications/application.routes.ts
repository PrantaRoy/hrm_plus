import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { resumeUpload } from "../../middleware/fileUpload";
import { getApplicationHandler, listApplicationsHandler, submitApplicationHandler } from "./application.controller";

// Public: no requireAuth. Still mounted behind tenantResolver in app.ts.
export const publicApplicationRouter = Router();
publicApplicationRouter.post("/:jobSlug", resumeUpload.single("resume"), submitApplicationHandler);

export const adminApplicationRouter = Router();
adminApplicationRouter.use(requireAuth, requireRole("Admin", "HR"));
adminApplicationRouter.get("/", listApplicationsHandler);
adminApplicationRouter.get("/:id", getApplicationHandler);
