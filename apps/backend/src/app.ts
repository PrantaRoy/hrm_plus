import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { corsOrigins } from "./config/env";
import { LOCAL_UPLOAD_ROOT } from "./storage";
import { logger } from "./logger";
import { tenantResolver } from "./middleware/tenantResolver";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/auth.routes";
import { employeeRouter } from "./modules/employees/employee.routes";
import { departmentRouter } from "./modules/departments/department.routes";
import { shiftRouter } from "./modules/shifts/shift.routes";
import { dutyScheduleRouter } from "./modules/duty-schedules/dutySchedule.routes";
import { rosterRouter } from "./modules/rosters/roster.routes";
import { holidayRouter } from "./modules/holidays/holiday.routes";
import { weekDayRouter } from "./modules/weekdays/weekday.routes";
import { leaveTypeRouter } from "./modules/leave-types/leaveType.routes";
import { designationRouter } from "./modules/designations/designation.routes";
import { roleRouter } from "./modules/roles/role.routes";
import { leaveRequestRouter } from "./modules/leave-requests/leaveRequest.routes";
import { attendanceRouter } from "./modules/attendance/attendance.routes";
import { ipRuleRouter } from "./modules/attendance-ip-rules/ipRule.routes";
import { locationRouter } from "./modules/attendance-locations/location.routes";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";
import { documentCategoryRouter } from "./modules/document-templates/documentCategory.routes";
import { documentTemplateRouter } from "./modules/document-templates/documentTemplate.routes";
import { documentRequestRouter } from "./modules/document-requests/documentRequest.routes";
import { documentVerifyRouter } from "./modules/document-verify/documentVerify.routes";
import { saasAuthRouter } from "./modules/saas/saasAuth/saasAuth.routes";
import { publicPackageRouter, adminPackageRouter } from "./modules/saas/packages/package.routes";
import { publicApplicationRouter, adminApplicationRouter } from "./modules/saas/applications/application.routes";
import { saasTenantRouter } from "./modules/saas/tenants/saasTenant.routes";
import { statsRouter } from "./modules/saas/stats/stats.routes";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());
  app.use(pinoHttp({ logger }));
  app.use(
    "/uploads",
    helmet.crossOriginResourcePolicy({ policy: "cross-origin" }),
    express.static(LOCAL_UPLOAD_ROOT)
  );

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  // Tenant-scoped API (existing employee portal)
  app.use("/api/auth", tenantResolver, authRouter);
  app.use("/api/employees", tenantResolver, employeeRouter);
  app.use("/api/departments", tenantResolver, departmentRouter);
  app.use("/api/shifts", tenantResolver, shiftRouter);
  app.use("/api/duty-schedules", tenantResolver, dutyScheduleRouter);
  app.use("/api/rosters", tenantResolver, rosterRouter);
  app.use("/api/holidays", tenantResolver, holidayRouter);
  app.use("/api/weekdays", tenantResolver, weekDayRouter);
  app.use("/api/leave-types", tenantResolver, leaveTypeRouter);
  app.use("/api/designations", tenantResolver, designationRouter);
  app.use("/api/roles", tenantResolver, roleRouter);
  app.use("/api/leave-requests", tenantResolver, leaveRequestRouter);
  app.use("/api/attendance", tenantResolver, attendanceRouter);
  app.use("/api/attendance-ip-rules", tenantResolver, ipRuleRouter);
  app.use("/api/attendance-locations", tenantResolver, locationRouter);
  app.use("/api/dashboard", tenantResolver, dashboardRouter);
  app.use("/api/document-categories", tenantResolver, documentCategoryRouter);
  app.use("/api/document-templates", tenantResolver, documentTemplateRouter);
  app.use("/api/document-requests", tenantResolver, documentRequestRouter);
  app.use("/api/document-verify", tenantResolver, documentVerifyRouter); // public — no requireAuth

  // SaaS control-plane API (public landing/signup + super-admin portal)
  app.use("/saas/admin/auth", saasAuthRouter);
  app.use("/saas/public/packages", publicPackageRouter);
  app.use("/saas/public/applications", publicApplicationRouter);
  app.use("/saas/admin/packages", adminPackageRouter);
  app.use("/saas/admin/applications", adminApplicationRouter);
  app.use("/saas/admin/tenants", saasTenantRouter);
  app.use("/saas/admin/stats", statsRouter);

  app.use(errorHandler);

  return app;
}
