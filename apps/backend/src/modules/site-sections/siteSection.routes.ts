import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  listSiteSectionsHandler,
  reorderSiteSectionsHandler,
  updateSiteSectionHandler,
} from "./siteSection.controller";

export const siteSectionRouter = Router();

siteSectionRouter.use(requireAuth, requireRole("Admin", "HR"));

siteSectionRouter.get("/", listSiteSectionsHandler);
siteSectionRouter.patch("/:id", updateSiteSectionHandler);
siteSectionRouter.post("/reorder", reorderSiteSectionsHandler);
