import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { blogFeaturedImageUpload } from "../../middleware/fileUpload";
import {
  createBlogPostHandler,
  deleteBlogPostHandler,
  getBlogPostHandler,
  listBlogPostsHandler,
  publishBlogPostHandler,
  unpublishBlogPostHandler,
  updateBlogPostHandler,
} from "./blogPost.controller";

export const blogPostRouter = Router();

blogPostRouter.use(requireAuth, requireRole("Admin", "HR"));

blogPostRouter.get("/", listBlogPostsHandler);
blogPostRouter.get("/:id", getBlogPostHandler);
blogPostRouter.post("/", blogFeaturedImageUpload.single("featuredImage"), createBlogPostHandler);
blogPostRouter.patch("/:id", blogFeaturedImageUpload.single("featuredImage"), updateBlogPostHandler);
blogPostRouter.delete("/:id", deleteBlogPostHandler);
blogPostRouter.post("/:id/publish", publishBlogPostHandler);
blogPostRouter.post("/:id/unpublish", unpublishBlogPostHandler);
