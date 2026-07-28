import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createDepartmentHandler,
  deleteDepartmentHandler,
  getDepartmentHandler,
  listDepartmentsHandler,
  updateDepartmentHandler,
} from "./department.controller";

export const departmentRouter = Router();

departmentRouter.use(requireAuth);

departmentRouter.get("/", listDepartmentsHandler);
departmentRouter.get("/:id", getDepartmentHandler);
departmentRouter.post("/", requireRole("Admin", "HR"), createDepartmentHandler);
departmentRouter.patch("/:id", requireRole("Admin", "HR"), updateDepartmentHandler);
departmentRouter.delete("/:id", requireRole("Admin", "HR"), deleteDepartmentHandler);
