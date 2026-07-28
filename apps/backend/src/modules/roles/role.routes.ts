import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createRoleHandler,
  deleteRoleHandler,
  getRoleHandler,
  listRolesHandler,
  updateRoleHandler,
} from "./role.controller";

export const roleRouter = Router();

roleRouter.use(requireAuth);

roleRouter.get("/", listRolesHandler);
roleRouter.get("/:id", getRoleHandler);
roleRouter.post("/", requireRole("Admin", "HR"), createRoleHandler);
roleRouter.patch("/:id", requireRole("Admin", "HR"), updateRoleHandler);
roleRouter.delete("/:id", requireRole("Admin", "HR"), deleteRoleHandler);
