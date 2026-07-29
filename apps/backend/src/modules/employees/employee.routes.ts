import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { avatarUpload } from "../../middleware/fileUpload";
import {
  createEmployeeHandler,
  getEmployeeHandler,
  listEmployeesHandler,
  updateEmployeeHandler,
  uploadEmployeeAvatarHandler,
} from "./employee.controller";
import { employeeDocumentRouter } from "./employeeDocument.routes";

export const employeeRouter = Router();

employeeRouter.use(requireAuth);

employeeRouter.get("/", listEmployeesHandler);
employeeRouter.get("/:id", getEmployeeHandler);
employeeRouter.post("/", requireRole("Admin", "HR"), createEmployeeHandler);
employeeRouter.patch("/:id", requireRole("Admin", "HR", "Manager"), updateEmployeeHandler);
employeeRouter.post(
  "/:id/avatar",
  requireRole("Admin", "HR", "Manager"),
  avatarUpload.single("avatar"),
  uploadEmployeeAvatarHandler
);
employeeRouter.use("/:id/documents", employeeDocumentRouter);
