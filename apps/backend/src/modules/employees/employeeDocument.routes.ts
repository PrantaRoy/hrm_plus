import { Router } from "express";
import { requireRole } from "../../middleware/auth";
import { documentUpload } from "../../middleware/fileUpload";
import {
  createEmployeeDocumentHandler,
  deleteEmployeeDocumentHandler,
  getEmployeeDocumentHandler,
  listEmployeeDocumentsHandler,
  updateEmployeeDocumentHandler,
} from "./employeeDocument.controller";

export const employeeDocumentRouter = Router({ mergeParams: true });

employeeDocumentRouter.get("/", listEmployeeDocumentsHandler);
employeeDocumentRouter.get("/:docId", getEmployeeDocumentHandler);
employeeDocumentRouter.post(
  "/",
  requireRole("Admin", "HR"),
  documentUpload.single("file"),
  createEmployeeDocumentHandler
);
employeeDocumentRouter.patch("/:docId", requireRole("Admin", "HR"), updateEmployeeDocumentHandler);
employeeDocumentRouter.delete("/:docId", requireRole("Admin", "HR"), deleteEmployeeDocumentHandler);
