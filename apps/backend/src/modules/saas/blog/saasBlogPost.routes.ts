import { Router } from "express";
import { requireSaasAdmin } from "../saasAuth/saasAuth.middleware";
import { blogFeaturedImageUpload } from "../../../middleware/fileUpload";
import {
  createSaasBlogPostHandler,
  deleteSaasBlogPostHandler,
  getPublicSaasBlogPostHandler,
  getSaasBlogPostHandler,
  listPublicSaasBlogPostsHandler,
  listSaasBlogPostsHandler,
  publishSaasBlogPostHandler,
  unpublishSaasBlogPostHandler,
  updateSaasBlogPostHandler,
} from "./saasBlogPost.controller";

export const publicSaasBlogRouter = Router();
publicSaasBlogRouter.get("/", listPublicSaasBlogPostsHandler);
publicSaasBlogRouter.get("/:slug", getPublicSaasBlogPostHandler);

export const adminSaasBlogRouter = Router();
adminSaasBlogRouter.use(requireSaasAdmin);
adminSaasBlogRouter.get("/", listSaasBlogPostsHandler);
adminSaasBlogRouter.get("/:id", getSaasBlogPostHandler);
adminSaasBlogRouter.post("/", blogFeaturedImageUpload.single("coverImage"), createSaasBlogPostHandler);
adminSaasBlogRouter.patch("/:id", blogFeaturedImageUpload.single("coverImage"), updateSaasBlogPostHandler);
adminSaasBlogRouter.delete("/:id", deleteSaasBlogPostHandler);
adminSaasBlogRouter.post("/:id/publish", publishSaasBlogPostHandler);
adminSaasBlogRouter.post("/:id/unpublish", unpublishSaasBlogPostHandler);
