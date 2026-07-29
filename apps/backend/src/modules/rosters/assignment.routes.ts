import { Router } from "express";
import { requireRole } from "../../middleware/auth";
import {
  createAssignmentHandler,
  deleteAssignmentHandler,
  listAssignmentsHandler,
  updateAssignmentHandler,
} from "./assignment.controller";

export const assignmentRouter = Router({ mergeParams: true });

assignmentRouter.get("/", listAssignmentsHandler);
assignmentRouter.post("/", requireRole("Admin", "HR", "Manager"), createAssignmentHandler);
assignmentRouter.patch("/:assignmentId", requireRole("Admin", "HR", "Manager"), updateAssignmentHandler);
assignmentRouter.delete("/:assignmentId", requireRole("Admin", "HR", "Manager"), deleteAssignmentHandler);
