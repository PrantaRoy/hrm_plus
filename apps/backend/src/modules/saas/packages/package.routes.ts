import { Router } from "express";
import { requireSaasAdmin } from "../saasAuth/saasAuth.middleware";
import {
  createPackageHandler,
  deletePackageHandler,
  listAdminPackagesHandler,
  listPublicPackagesHandler,
  updatePackageHandler,
} from "./package.controller";

export const publicPackageRouter = Router();
publicPackageRouter.get("/", listPublicPackagesHandler);

export const adminPackageRouter = Router();
adminPackageRouter.use(requireSaasAdmin);
adminPackageRouter.get("/", listAdminPackagesHandler);
adminPackageRouter.post("/", createPackageHandler);
adminPackageRouter.patch("/:id", updatePackageHandler);
adminPackageRouter.delete("/:id", deletePackageHandler);
