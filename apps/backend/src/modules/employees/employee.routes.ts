import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createEmployeeHandler,
  getEmployeeHandler,
  listEmployeesHandler,
  updateEmployeeHandler,
} from "./employee.controller";

export const employeeRouter = Router();

employeeRouter.use(requireAuth);

employeeRouter.get("/", listEmployeesHandler);
employeeRouter.get("/:id", getEmployeeHandler);
employeeRouter.post("/", requireRole("Admin", "HR"), createEmployeeHandler);
employeeRouter.patch("/:id", requireRole("Admin", "HR", "Manager"), updateEmployeeHandler);
