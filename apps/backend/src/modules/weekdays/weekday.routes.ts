import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createWeekDayHandler,
  deleteWeekDayHandler,
  getWeekDayHandler,
  listWeekDaysHandler,
  updateWeekDayHandler,
} from "./weekday.controller";

export const weekDayRouter = Router();

weekDayRouter.use(requireAuth);

weekDayRouter.get("/", listWeekDaysHandler);
weekDayRouter.get("/:id", getWeekDayHandler);
weekDayRouter.post("/", requireRole("Admin", "HR"), createWeekDayHandler);
weekDayRouter.patch("/:id", requireRole("Admin", "HR"), updateWeekDayHandler);
weekDayRouter.delete("/:id", requireRole("Admin", "HR"), deleteWeekDayHandler);
