import { Router } from "express";
import { requireSaasAdmin } from "../saasAuth/saasAuth.middleware";
import { blogFeaturedImageUpload, faviconUpload, heroMediaUpload, logoUpload } from "../../../middleware/fileUpload";
import {
  createLandingBlockHandler,
  deleteLandingBlockHandler,
  getLandingContentHandler,
  getLandingSettingsHandler,
  listLandingBlocksHandler,
  reorderLandingBlocksHandler,
  updateLandingBlockHandler,
  updateLandingSettingsHandler,
  uploadLandingBlockMediaHandler,
  uploadLandingImageHandler,
} from "./saasLanding.controller";

// Public aggregation endpoint — no auth, TTL-cached.
export const publicLandingRouter = Router();
publicLandingRouter.get("/", getLandingContentHandler);

const imageUploadByField: Record<string, ReturnType<typeof logoUpload.single>> = {
  logo: logoUpload.single("file"),
  favicon: faviconUpload.single("file"),
  heroImage: heroMediaUpload.single("file"),
  ogImage: blogFeaturedImageUpload.single("file"),
};

export const adminLandingRouter = Router();
adminLandingRouter.use(requireSaasAdmin);

adminLandingRouter.get("/settings", getLandingSettingsHandler);
adminLandingRouter.patch("/settings", updateLandingSettingsHandler);
adminLandingRouter.post(
  "/settings/images/:field",
  (req, res, next) => {
    const handler = imageUploadByField[req.params.field];
    if (!handler) return next();
    return handler(req, res, next);
  },
  uploadLandingImageHandler
);

adminLandingRouter.get("/blocks", listLandingBlocksHandler);
adminLandingRouter.post("/blocks", createLandingBlockHandler);
adminLandingRouter.post("/blocks/reorder", reorderLandingBlocksHandler);
adminLandingRouter.patch("/blocks/:id", updateLandingBlockHandler);
adminLandingRouter.delete("/blocks/:id", deleteLandingBlockHandler);
adminLandingRouter.post(
  "/blocks/:id/media",
  heroMediaUpload.single("file"),
  uploadLandingBlockMediaHandler
);
