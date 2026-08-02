import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  approveLeaveRequestHandler,
  cancelLeaveRequestHandler,
  createLeaveRequestHandler,
  getLeaveRequestHandler,
  listLeaveRequestsHandler,
  listMyAllocationsHandler,
  listMyLeaveRequestsHandler,
  listPendingMyApprovalHandler,
  rejectLeaveRequestHandler,
} from "./leaveRequest.controller";

export const leaveRequestRouter = Router();

leaveRequestRouter.use(requireAuth);

leaveRequestRouter.get("/my", listMyLeaveRequestsHandler);
leaveRequestRouter.get("/my-allocations", listMyAllocationsHandler);
leaveRequestRouter.get("/pending-my-approval", listPendingMyApprovalHandler);
leaveRequestRouter.get("/", requireRole("Admin", "HR", "Manager"), listLeaveRequestsHandler);
leaveRequestRouter.get("/:id", getLeaveRequestHandler);
leaveRequestRouter.post("/", createLeaveRequestHandler);
leaveRequestRouter.post("/:id/approve", approveLeaveRequestHandler);
leaveRequestRouter.post("/:id/reject", rejectLeaveRequestHandler);
leaveRequestRouter.post("/:id/cancel", cancelLeaveRequestHandler);
