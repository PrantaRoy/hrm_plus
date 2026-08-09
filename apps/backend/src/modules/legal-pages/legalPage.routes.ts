import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createLegalPageHandler,
  deleteLegalPageHandler,
  getLegalPageHandler,
  listLegalPagesHandler,
  updateLegalPageHandler,
} from "./legalPage.controller";

export const legalPageRouter = Router();

legalPageRouter.use(requireAuth, requireRole("Admin", "HR"));

legalPageRouter.get("/", listLegalPagesHandler);
legalPageRouter.get("/:id", getLegalPageHandler);
legalPageRouter.post("/", createLegalPageHandler);
legalPageRouter.patch("/:id", updateLegalPageHandler);
legalPageRouter.delete("/:id", deleteLegalPageHandler);
