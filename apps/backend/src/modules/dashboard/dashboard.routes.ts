import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { getCalendarHandler, getSummaryHandler, getTrendsHandler } from "./dashboard.controller";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);
dashboardRouter.use(requireRole("Admin", "HR", "Manager"));

dashboardRouter.get("/summary", getSummaryHandler);
dashboardRouter.get("/trends", getTrendsHandler);
dashboardRouter.get("/calendar", getCalendarHandler);
