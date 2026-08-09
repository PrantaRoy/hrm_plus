import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createSocialLinkHandler,
  deleteSocialLinkHandler,
  listSocialLinksHandler,
  reorderSocialLinksHandler,
  updateSocialLinkHandler,
} from "./socialLink.controller";

export const socialLinkRouter = Router();

socialLinkRouter.use(requireAuth, requireRole("Admin", "HR"));

socialLinkRouter.get("/", listSocialLinksHandler);
socialLinkRouter.post("/", createSocialLinkHandler);
socialLinkRouter.patch("/:id", updateSocialLinkHandler);
socialLinkRouter.delete("/:id", deleteSocialLinkHandler);
socialLinkRouter.post("/reorder", reorderSocialLinksHandler);
