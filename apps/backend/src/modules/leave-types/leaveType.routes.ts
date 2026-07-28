import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createLeaveTypeHandler,
  deleteLeaveTypeHandler,
  getLeaveTypeHandler,
  listLeaveTypesHandler,
  updateLeaveTypeHandler,
} from "./leaveType.controller";

export const leaveTypeRouter = Router();

leaveTypeRouter.use(requireAuth);

leaveTypeRouter.get("/", listLeaveTypesHandler);
leaveTypeRouter.get("/:id", getLeaveTypeHandler);
leaveTypeRouter.post("/", requireRole("Admin", "HR"), createLeaveTypeHandler);
leaveTypeRouter.patch("/:id", requireRole("Admin", "HR"), updateLeaveTypeHandler);
leaveTypeRouter.delete("/:id", requireRole("Admin", "HR"), deleteLeaveTypeHandler);
