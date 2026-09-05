import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { getAiSettingsHandler, updateAiSettingsHandler } from "./aiSettings.controller";

export const aiSettingsRouter = Router();

// Admin-only (stricter than General Settings) — this exposes third-party API credential config.
aiSettingsRouter.use(requireAuth, requireRole("Admin"));
aiSettingsRouter.get("/", getAiSettingsHandler);
aiSettingsRouter.patch("/", updateAiSettingsHandler);
