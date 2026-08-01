import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  checkInHandler,
  checkOutHandler,
  endBreakHandler,
  getEmployeeMethodsHandler,
  getSettingsHandler,
  getTodayHandler,
  listAttendanceHandler,
  listMyAttendanceHandler,
  setEmployeeMethodsHandler,
  startBreakHandler,
  updateSettingsHandler,
} from "./attendance.controller";

export const attendanceRouter = Router();

attendanceRouter.use(requireAuth);

attendanceRouter.get("/today", getTodayHandler);
attendanceRouter.post("/check-in", checkInHandler);
attendanceRouter.post("/check-out", checkOutHandler);
attendanceRouter.post("/breaks/start", startBreakHandler);
attendanceRouter.post("/breaks/end", endBreakHandler);
attendanceRouter.get("/my", listMyAttendanceHandler);

attendanceRouter.get("/", requireRole("Admin", "HR", "Manager"), listAttendanceHandler);
attendanceRouter.get("/settings", requireRole("Admin", "HR"), getSettingsHandler);
attendanceRouter.patch("/settings", requireRole("Admin", "HR"), updateSettingsHandler);
attendanceRouter.get("/employees/:employeeId/methods", requireRole("Admin", "HR"), getEmployeeMethodsHandler);
attendanceRouter.put("/employees/:employeeId/methods", requireRole("Admin", "HR"), setEmployeeMethodsHandler);
