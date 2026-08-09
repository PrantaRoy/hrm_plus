import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { galleryImageUpload } from "../../middleware/fileUpload";
import {
  createGalleryItemHandler,
  deleteGalleryItemHandler,
  listGalleryItemsHandler,
  reorderGalleryItemsHandler,
  updateGalleryItemHandler,
} from "./galleryItem.controller";

export const galleryItemRouter = Router();

galleryItemRouter.use(requireAuth, requireRole("Admin", "HR"));

const galleryFileFields = galleryImageUpload.fields([
  { name: "image", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);

galleryItemRouter.get("/", listGalleryItemsHandler);
galleryItemRouter.post("/", galleryFileFields, createGalleryItemHandler);
galleryItemRouter.patch("/:id", galleryFileFields, updateGalleryItemHandler);
galleryItemRouter.delete("/:id", deleteGalleryItemHandler);
galleryItemRouter.post("/reorder", reorderGalleryItemsHandler);
