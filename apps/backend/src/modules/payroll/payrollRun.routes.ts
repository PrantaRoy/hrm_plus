import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  approvePaymentHandler,
  bankExportHandler,
  generateDraftPayrollRunHandler,
  getPayrollRunHandler,
  irdPaydayFilingHandler,
  listPayrollRunsHandler,
  listRunPayslipsHandler,
  rejectPaymentHandler,
  submitPayrollForPaymentHandler,
} from "./payrollRun.controller";

export const payrollRunRouter = Router();
payrollRunRouter.use(requireAuth);
payrollRunRouter.get("/", requireRole("Admin", "Payroll", "Finance"), listPayrollRunsHandler);
payrollRunRouter.get("/:id", requireRole("Admin", "Payroll", "Finance"), getPayrollRunHandler);
payrollRunRouter.get("/:id/payslips", requireRole("Admin", "Payroll", "Finance"), listRunPayslipsHandler);
payrollRunRouter.get("/:id/bank-export", requireRole("Admin", "Payroll", "Finance"), bankExportHandler);
payrollRunRouter.get("/:id/ird-payday-filing", requireRole("Admin", "Finance"), irdPaydayFilingHandler);

// Payroll generates and submits — Payroll must not also approve its own run's payment.
payrollRunRouter.post("/generate", requireRole("Admin", "Payroll"), generateDraftPayrollRunHandler);
payrollRunRouter.post("/:id/submit", requireRole("Admin", "Payroll"), submitPayrollForPaymentHandler);

// Finance (or Admin) gives final payment approval — separated from Payroll's role above.
payrollRunRouter.post("/:id/approve-payment", requireRole("Admin", "Finance"), approvePaymentHandler);
payrollRunRouter.post("/:id/reject-payment", requireRole("Admin", "Finance"), rejectPaymentHandler);
