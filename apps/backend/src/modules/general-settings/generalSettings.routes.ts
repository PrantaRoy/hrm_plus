import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { faviconUpload, logoUpload } from "../../middleware/fileUpload";
import {
  getGeneralSettingsHandler,
  updateGeneralSettingsHandler,
  uploadGeneralFaviconHandler,
  uploadGeneralLogoHandler,
} from "./generalSettings.controller";

export const generalSettingsRouter = Router();

generalSettingsRouter.use(requireAuth);

// Readable by any authenticated user — site title/logo/favicon drive shared UI chrome.
generalSettingsRouter.get("/", getGeneralSettingsHandler);
generalSettingsRouter.patch("/", requireRole("Admin", "HR"), updateGeneralSettingsHandler);
generalSettingsRouter.post("/logo", requireRole("Admin", "HR"), logoUpload.single("logo"), uploadGeneralLogoHandler);
generalSettingsRouter.post(
  "/favicon",
  requireRole("Admin", "HR"),
  faviconUpload.single("favicon"),
  uploadGeneralFaviconHandler
);
