import { Router } from "express";
import {
  changePasswordHandler,
  checkEmailHandler,
  loginHandler,
  meHandler,
  requestPasswordResetHandler,
  resetPasswordHandler,
  verifyTenantHandler,
} from "./auth.controller";
import { requireAuth } from "../../middleware/auth";

export const authRouter = Router();

authRouter.post("/check-email", checkEmailHandler);
authRouter.post("/verify-tenant", verifyTenantHandler);
authRouter.post("/forgot-password", requestPasswordResetHandler);
authRouter.post("/reset-password", resetPasswordHandler);
authRouter.post("/login", loginHandler);
authRouter.get("/me", requireAuth, meHandler);
authRouter.post("/change-password", requireAuth, changePasswordHandler);
