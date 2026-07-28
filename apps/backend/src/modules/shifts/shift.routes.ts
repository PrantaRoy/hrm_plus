import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createShiftHandler,
  deleteShiftHandler,
  getShiftHandler,
  listShiftsHandler,
  updateShiftHandler,
} from "./shift.controller";

export const shiftRouter = Router();

shiftRouter.use(requireAuth);

shiftRouter.get("/", listShiftsHandler);
shiftRouter.get("/:id", getShiftHandler);
shiftRouter.post("/", requireRole("Admin", "HR"), createShiftHandler);
shiftRouter.patch("/:id", requireRole("Admin", "HR"), updateShiftHandler);
shiftRouter.delete("/:id", requireRole("Admin", "HR"), deleteShiftHandler);
