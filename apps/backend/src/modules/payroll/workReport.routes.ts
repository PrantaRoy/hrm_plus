import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  approveWorkReportHandler,
  deleteWorkReportHandler,
  generateWorkReportsHandler,
  getWorkReportHandler,
  listWorkReportsHandler,
  updateWorkReportHandler,
} from "./workReport.controller";

export const workReportRouter = Router();
workReportRouter.use(requireAuth, requireRole("Admin", "HR", "Payroll"));
workReportRouter.get("/", listWorkReportsHandler);
workReportRouter.get("/:id", getWorkReportHandler);
workReportRouter.post("/generate", requireRole("Admin", "HR", "Payroll"), generateWorkReportsHandler);
workReportRouter.post("/:id/approve", requireRole("Admin", "HR"), approveWorkReportHandler);
workReportRouter.patch("/:id", requireRole("Admin", "HR"), updateWorkReportHandler);
workReportRouter.delete("/:id", requireRole("Admin"), deleteWorkReportHandler);
