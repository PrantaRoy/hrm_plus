import { Router } from "express";
import { requireRole } from "../../middleware/auth";
import {
  createLeaveAllocationHandler,
  deleteLeaveAllocationHandler,
  getLeaveAllocationHandler,
  listLeaveAllocationsHandler,
  updateLeaveAllocationHandler,
} from "./leaveAllocation.controller";

export const leaveAllocationRouter = Router({ mergeParams: true });

leaveAllocationRouter.get("/", listLeaveAllocationsHandler);
leaveAllocationRouter.get("/:allocationId", getLeaveAllocationHandler);
leaveAllocationRouter.post("/", requireRole("Admin", "HR"), createLeaveAllocationHandler);
leaveAllocationRouter.patch("/:allocationId", requireRole("Admin", "HR"), updateLeaveAllocationHandler);
leaveAllocationRouter.delete("/:allocationId", requireRole("Admin", "HR"), deleteLeaveAllocationHandler);
