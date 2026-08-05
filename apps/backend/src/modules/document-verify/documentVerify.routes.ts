import { Router } from "express";
import { verifyDocumentHandler } from "./documentVerify.controller";

// Deliberately public: no requireAuth here. This is the one tenant-scoped route in
// the whole app that's reachable without a logged-in session — anyone with a
// reference number (e.g. a bank verifying a salary certificate) can check validity.
// Still mounted behind tenantResolver in app.ts, since verification is per-tenant.
export const documentVerifyRouter = Router();

documentVerifyRouter.get("/:referenceNumber", verifyDocumentHandler);
