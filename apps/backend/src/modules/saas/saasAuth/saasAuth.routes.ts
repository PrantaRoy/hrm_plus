import { Router } from "express";
import { saasLoginHandler, saasMeHandler } from "./saasAuth.controller";
import { requireSaasAdmin } from "./saasAuth.middleware";

export const saasAuthRouter = Router();

saasAuthRouter.post("/login", saasLoginHandler);
saasAuthRouter.get("/me", requireSaasAdmin, saasMeHandler);
