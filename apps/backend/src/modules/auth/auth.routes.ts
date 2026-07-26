import { Router } from "express";
import { changePasswordHandler, checkEmailHandler, loginHandler, meHandler } from "./auth.controller";
import { requireAuth } from "../../middleware/auth";

export const authRouter = Router();

authRouter.post("/check-email", checkEmailHandler);
authRouter.post("/login", loginHandler);
authRouter.get("/me", requireAuth, meHandler);
authRouter.post("/change-password", requireAuth, changePasswordHandler);
