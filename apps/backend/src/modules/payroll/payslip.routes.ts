import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { getMyPayslipHandler, listMyPayslipsHandler } from "./payslip.controller";

export const payslipRouter = Router();
payslipRouter.use(requireAuth);
payslipRouter.get("/my", listMyPayslipsHandler);
payslipRouter.get("/my/:id", getMyPayslipHandler);
