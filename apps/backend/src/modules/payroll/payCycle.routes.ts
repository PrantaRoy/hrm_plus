import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  assignEmployeesHandler,
  createPayCycleHandler,
  getPayCycleHandler,
  listPayCyclesHandler,
  updatePayCycleHandler,
} from "./payCycle.controller";

export const payCycleRouter = Router();
payCycleRouter.use(requireAuth, requireRole("Admin", "HR", "Payroll"));
payCycleRouter.get("/", listPayCyclesHandler);
payCycleRouter.get("/:id", getPayCycleHandler);
payCycleRouter.post("/", createPayCycleHandler);
payCycleRouter.patch("/:id", updatePayCycleHandler);
payCycleRouter.post("/:id/assign-employees", assignEmployeesHandler);
