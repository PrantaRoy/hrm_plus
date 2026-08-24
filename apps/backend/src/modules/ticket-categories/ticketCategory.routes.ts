import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { listActiveTicketCategoriesHandler } from "./ticketCategory.controller";

export const ticketCategoryRouter = Router();

ticketCategoryRouter.use(requireAuth, requireRole("Admin"));
ticketCategoryRouter.get("/", listActiveTicketCategoriesHandler);
