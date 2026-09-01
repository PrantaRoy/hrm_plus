import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  getSchedulerSettingsHandler,
  updateSchedulerSettingsHandler,
} from "./schedulerSettings.controller";

export const schedulerSettingsRouter = Router();

schedulerSettingsRouter.use(requireAuth);

// Readable by any authenticated user — the schedule-a-meeting form needs to know which
// conflicts hard-block so it can disable the confirm button client-side.
schedulerSettingsRouter.get("/", getSchedulerSettingsHandler);
schedulerSettingsRouter.patch("/", requireRole("Admin", "HR"), updateSchedulerSettingsHandler);
