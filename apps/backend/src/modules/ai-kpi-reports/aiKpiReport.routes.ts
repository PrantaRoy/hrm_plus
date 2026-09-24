import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  deleteAiKpiReportHandler,
  generateAiKpiReportHandler,
  getAiKpiReportHandler,
  listAiKpiReportsHandler,
} from "./aiKpiReport.controller";

export const aiKpiReportRouter = Router();

// Admin/HR only — the reports contain per-employee performance commentary.
aiKpiReportRouter.use(requireAuth, requireRole("Admin", "HR"));
aiKpiReportRouter.post("/", generateAiKpiReportHandler);
aiKpiReportRouter.get("/", listAiKpiReportsHandler);
aiKpiReportRouter.get("/:id", getAiKpiReportHandler);
aiKpiReportRouter.delete("/:id", deleteAiKpiReportHandler);
