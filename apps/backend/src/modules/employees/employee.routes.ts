import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { avatarUpload, signatureUpload } from "../../middleware/fileUpload";
import {
  createEmployeeHandler,
  getEmployeeHandler,
  listEmployeesHandler,
  resetEmployeePasswordHandler,
  updateEmployeeHandler,
  uploadEmployeeAvatarHandler,
  uploadEmployeeSignatureHandler,
} from "./employee.controller";
import { employeeDocumentRouter } from "./employeeDocument.routes";
import { leaveAllocationRouter } from "../leave-allocations/leaveAllocation.routes";

export const employeeRouter = Router();

employeeRouter.use(requireAuth);

employeeRouter.get("/", listEmployeesHandler);
employeeRouter.get("/:id", getEmployeeHandler);
employeeRouter.post("/", requireRole("Admin", "HR"), createEmployeeHandler);
employeeRouter.patch("/:id", requireRole("Admin", "HR", "Manager"), updateEmployeeHandler);
employeeRouter.post("/:id/reset-password", requireRole("Admin", "HR"), resetEmployeePasswordHandler);
employeeRouter.post(
  "/:id/avatar",
  requireRole("Admin", "HR", "Manager"),
  avatarUpload.single("avatar"),
  uploadEmployeeAvatarHandler
);
employeeRouter.post(
  "/:id/signature",
  requireRole("Admin", "HR", "Manager"),
  signatureUpload.single("signature"),
  uploadEmployeeSignatureHandler
);
employeeRouter.use("/:id/documents", employeeDocumentRouter);
employeeRouter.use("/:id/leave-allocations", leaveAllocationRouter);
