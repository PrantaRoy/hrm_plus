import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createDesignationHandler,
  deleteDesignationHandler,
  getDesignationHandler,
  listDesignationsHandler,
  updateDesignationHandler,
} from "./designation.controller";

export const designationRouter = Router();

designationRouter.use(requireAuth);

designationRouter.get("/", listDesignationsHandler);
designationRouter.get("/:id", getDesignationHandler);
designationRouter.post("/", requireRole("Admin", "HR"), createDesignationHandler);
designationRouter.patch("/:id", requireRole("Admin", "HR"), updateDesignationHandler);
designationRouter.delete("/:id", requireRole("Admin", "HR"), deleteDesignationHandler);
