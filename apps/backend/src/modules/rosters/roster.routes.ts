import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  approveRosterHandler,
  autoGenerateRosterHandler,
  createRosterHandler,
  deleteRosterHandler,
  getEmployeeScheduleHandler,
  getMyScheduleHandler,
  getRosterHandler,
  getScheduleReportHandler,
  listRostersHandler,
  updateRosterHandler,
} from "./roster.controller";
import { assignmentRouter } from "./assignment.routes";

export const rosterRouter = Router();

rosterRouter.use(requireAuth);

rosterRouter.get("/my-schedule", getMyScheduleHandler);
rosterRouter.get("/schedule-report", getScheduleReportHandler);
rosterRouter.get("/employees/:employeeId/schedule", getEmployeeScheduleHandler);
rosterRouter.get("/", listRostersHandler);
rosterRouter.get("/:id", getRosterHandler);
rosterRouter.post("/", requireRole("Admin", "HR", "Manager"), createRosterHandler);
rosterRouter.patch("/:id", requireRole("Admin", "HR", "Manager"), updateRosterHandler);
rosterRouter.delete("/:id", requireRole("Admin", "HR", "Manager"), deleteRosterHandler);
rosterRouter.post("/:id/auto-generate", requireRole("Admin", "HR", "Manager"), autoGenerateRosterHandler);
rosterRouter.post("/:id/approve", requireRole("Admin", "HR", "Manager"), approveRosterHandler);
rosterRouter.use("/:id/assignments", assignmentRouter);
