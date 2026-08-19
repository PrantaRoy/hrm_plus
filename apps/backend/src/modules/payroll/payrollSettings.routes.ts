import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { getPayrollSettingsHandler, updatePayrollSettingsHandler } from "./payrollSettings.controller";

export const payrollSettingsRouter = Router();
payrollSettingsRouter.use(requireAuth);
payrollSettingsRouter.get("/", requireRole("Admin", "HR", "Payroll", "Finance"), getPayrollSettingsHandler);
payrollSettingsRouter.patch("/", requireRole("Admin", "Payroll"), updatePayrollSettingsHandler);
