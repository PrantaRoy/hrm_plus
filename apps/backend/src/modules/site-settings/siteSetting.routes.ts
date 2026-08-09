import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { faviconUpload, logoUpload } from "../../middleware/fileUpload";
import {
  getSiteSettingsHandler,
  updateSiteSettingsHandler,
  uploadSiteFaviconHandler,
  uploadSiteLogoHandler,
} from "./siteSetting.controller";

export const siteSettingRouter = Router();

siteSettingRouter.use(requireAuth, requireRole("Admin", "HR"));

siteSettingRouter.get("/", getSiteSettingsHandler);
siteSettingRouter.patch("/", updateSiteSettingsHandler);
siteSettingRouter.post("/logo", logoUpload.single("logo"), uploadSiteLogoHandler);
siteSettingRouter.post("/favicon", faviconUpload.single("favicon"), uploadSiteFaviconHandler);
