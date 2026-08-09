import { Router } from "express";
import { getSiteContentHandler } from "./siteContent.controller";

// Public: no requireAuth. Still mounted behind tenantResolver in app.ts.
export const publicSiteContentRouter = Router();
publicSiteContentRouter.get("/", getSiteContentHandler);
