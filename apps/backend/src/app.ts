import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { env } from "./config/env";
import { logger } from "./logger";
import { tenantResolver } from "./middleware/tenantResolver";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/auth.routes";
import { employeeRouter } from "./modules/employees/employee.routes";
import { departmentRouter } from "./modules/departments/department.routes";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", tenantResolver, authRouter);
  app.use("/api/employees", tenantResolver, employeeRouter);
  app.use("/api/departments", tenantResolver, departmentRouter);

  app.use(errorHandler);

  return app;
}
