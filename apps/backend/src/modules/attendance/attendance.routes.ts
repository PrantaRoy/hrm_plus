import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  approveDeviceHandler,
  checkInHandler,
  checkOutHandler,
  endBreakHandler,
  getEmployeeMethodsHandler,
  getEmployeeRulesHandler,
  getSettingsHandler,
  getMyWorksheetHandler,
  getShiftAttendanceLogHandler,
  getTodayHandler,
  getWorksheetHandler,
  listAttendanceHandler,
  listEmployeeDevicesHandler,
  listMyAttendanceHandler,
  rejectDeviceHandler,
  setEmployeeMethodsHandler,
  setEmployeeRulesHandler,
  setManualAttendanceHandler,
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
attendanceRouter.get("/worksheet/my", getMyWorksheetHandler);

attendanceRouter.get("/", requireRole("Admin", "HR", "Manager"), listAttendanceHandler);
attendanceRouter.get("/shift-log", requireRole("Admin", "HR", "Manager"), getShiftAttendanceLogHandler);
attendanceRouter.get("/worksheet", requireRole("Admin", "HR", "Manager"), getWorksheetHandler);
attendanceRouter.get("/settings", requireRole("Admin", "HR"), getSettingsHandler);
attendanceRouter.patch("/settings", requireRole("Admin", "HR"), updateSettingsHandler);
attendanceRouter.put(
  "/employees/:employeeId/manual-entry",
  requireRole("Admin", "HR"),
  setManualAttendanceHandler
);
attendanceRouter.get("/employees/:employeeId/methods", requireRole("Admin", "HR"), getEmployeeMethodsHandler);
attendanceRouter.put("/employees/:employeeId/methods", requireRole("Admin", "HR"), setEmployeeMethodsHandler);
attendanceRouter.get("/employees/:employeeId/rules", requireRole("Admin", "HR"), getEmployeeRulesHandler);
attendanceRouter.put("/employees/:employeeId/rules", requireRole("Admin", "HR"), setEmployeeRulesHandler);
attendanceRouter.get("/employees/:employeeId/devices", requireRole("Admin", "HR"), listEmployeeDevicesHandler);
attendanceRouter.post(
  "/employees/:employeeId/devices/:deviceId/approve",
  requireRole("Admin", "HR"),
  approveDeviceHandler
);
attendanceRouter.post(
  "/employees/:employeeId/devices/:deviceId/reject",
  requireRole("Admin", "HR"),
  rejectDeviceHandler
);
