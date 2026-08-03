import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createHolidayHandler,
  deleteHolidayHandler,
  getCalendarHandler,
  getHolidayHandler,
  importHolidaysHandler,
  listHolidaysHandler,
  publishHolidayHandler,
  publishYearHandler,
  unpublishHolidayHandler,
  updateHolidayHandler,
} from "./holiday.controller";

export const holidayRouter = Router();

holidayRouter.use(requireAuth);

holidayRouter.get("/calendar", getCalendarHandler);
holidayRouter.get("/", requireRole("Admin", "HR"), listHolidaysHandler);
holidayRouter.get("/:id", requireRole("Admin", "HR"), getHolidayHandler);
holidayRouter.post("/", requireRole("Admin", "HR"), createHolidayHandler);
holidayRouter.patch("/:id", requireRole("Admin", "HR"), updateHolidayHandler);
holidayRouter.delete("/:id", requireRole("Admin", "HR"), deleteHolidayHandler);
holidayRouter.post("/import", requireRole("Admin", "HR"), importHolidaysHandler);
holidayRouter.post("/publish-year", requireRole("Admin", "HR"), publishYearHandler);
holidayRouter.post("/:id/publish", requireRole("Admin", "HR"), publishHolidayHandler);
holidayRouter.post("/:id/unpublish", requireRole("Admin", "HR"), unpublishHolidayHandler);
