import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  assignAssetHandler,
  createAssetHandler,
  getAssetHandler,
  listAssetsForEmployeeHandler,
  listAssetsHandler,
  listMyAssetsHandler,
  retireAssetHandler,
  returnAssetHandler,
  startOffboardingChecklistHandler,
  updateAssetHandler,
} from "./asset.controller";

export const assetRouter = Router();

assetRouter.use(requireAuth);

// Reads: any authenticated user (an employee can see the assets currently assigned to them).
assetRouter.get("/", listAssetsHandler);
assetRouter.get("/my", listMyAssetsHandler);
assetRouter.get("/:id", getAssetHandler);
assetRouter.get("/employee/:employeeId", listAssetsForEmployeeHandler);

// Mutations: Admin/HR only.
assetRouter.post("/", requireRole("Admin", "HR"), createAssetHandler);
assetRouter.patch("/:id", requireRole("Admin", "HR"), updateAssetHandler);
assetRouter.post("/:id/retire", requireRole("Admin", "HR"), retireAssetHandler);
assetRouter.post("/:id/assign", requireRole("Admin", "HR"), assignAssetHandler);
assetRouter.post("/:id/return", requireRole("Admin", "HR"), returnAssetHandler);
assetRouter.post(
  "/employee/:employeeId/start-offboarding-checklist",
  requireRole("Admin", "HR"),
  startOffboardingChecklistHandler
);
