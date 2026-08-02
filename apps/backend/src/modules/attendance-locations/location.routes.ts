import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createLocationHandler,
  deleteLocationHandler,
  listLocationsHandler,
  updateLocationHandler,
} from "./location.controller";

export const locationRouter = Router();

locationRouter.use(requireAuth);

locationRouter.get("/", listLocationsHandler);
locationRouter.post("/", requireRole("Admin", "HR"), createLocationHandler);
locationRouter.patch("/:id", requireRole("Admin", "HR"), updateLocationHandler);
locationRouter.delete("/:id", requireRole("Admin", "HR"), deleteLocationHandler);
