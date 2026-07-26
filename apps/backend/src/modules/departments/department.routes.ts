import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { createDepartmentHandler, listDepartmentsHandler } from "./department.controller";

export const departmentRouter = Router();

departmentRouter.use(requireAuth);

departmentRouter.get("/", listDepartmentsHandler);
departmentRouter.post("/", requireRole("Admin", "HR"), createDepartmentHandler);
