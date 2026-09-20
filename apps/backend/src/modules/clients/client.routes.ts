import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createClientHandler,
  deleteClientHandler,
  getClientHandler,
  listClientsHandler,
  updateClientHandler,
} from "./client.controller";

export const clientRouter = Router();

// Client records hold contact details, so the whole resource is limited to managers.
clientRouter.use(requireAuth, requireRole("Admin", "HR", "Manager"));

clientRouter.get("/", listClientsHandler);
clientRouter.post("/", createClientHandler);
clientRouter.get("/:id", getClientHandler);
clientRouter.patch("/:id", updateClientHandler);
clientRouter.delete("/:id", deleteClientHandler);
