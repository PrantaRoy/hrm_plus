import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createDutyScheduleHandler,
  deleteDutyScheduleHandler,
  getDutyScheduleHandler,
  listDutySchedulesHandler,
  updateDutyScheduleHandler,
} from "./dutySchedule.controller";

export const dutyScheduleRouter = Router();

dutyScheduleRouter.use(requireAuth);

dutyScheduleRouter.get("/", listDutySchedulesHandler);
dutyScheduleRouter.get("/:id", getDutyScheduleHandler);
dutyScheduleRouter.post("/", requireRole("Admin", "HR"), createDutyScheduleHandler);
dutyScheduleRouter.patch("/:id", requireRole("Admin", "HR"), updateDutyScheduleHandler);
dutyScheduleRouter.delete("/:id", requireRole("Admin", "HR"), deleteDutyScheduleHandler);
