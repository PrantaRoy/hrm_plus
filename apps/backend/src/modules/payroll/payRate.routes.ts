import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { createPayRateHandler, listPayRatesHandler } from "./payRate.controller";

export const payRateRouter = Router();
payRateRouter.use(requireAuth, requireRole("Admin", "HR", "Payroll"));
payRateRouter.get("/employees/:employeeId", listPayRatesHandler);
payRateRouter.post("/", createPayRateHandler);
