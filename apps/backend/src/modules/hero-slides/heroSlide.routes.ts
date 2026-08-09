import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { heroMediaUpload } from "../../middleware/fileUpload";
import {
  createHeroSlideHandler,
  deleteHeroSlideHandler,
  getHeroSlideHandler,
  listHeroSlidesHandler,
  reorderHeroSlidesHandler,
  updateHeroSlideHandler,
} from "./heroSlide.controller";

export const heroSlideRouter = Router();

heroSlideRouter.use(requireAuth, requireRole("Admin", "HR"));

heroSlideRouter.get("/", listHeroSlidesHandler);
heroSlideRouter.get("/:id", getHeroSlideHandler);
heroSlideRouter.post("/", heroMediaUpload.single("media"), createHeroSlideHandler);
heroSlideRouter.patch("/:id", heroMediaUpload.single("media"), updateHeroSlideHandler);
heroSlideRouter.delete("/:id", deleteHeroSlideHandler);
heroSlideRouter.post("/reorder", reorderHeroSlidesHandler);
