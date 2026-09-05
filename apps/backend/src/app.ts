import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { corsOrigins, isTenantOrigin } from "./config/env";
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
import { generalSettingsRouter } from "./modules/general-settings/generalSettings.routes";
import { aiSettingsRouter } from "./modules/ai-settings/aiSettings.routes";
import { documentCategoryRouter } from "./modules/document-templates/documentCategory.routes";
import { documentTemplateRouter } from "./modules/document-templates/documentTemplate.routes";
import { documentRequestRouter } from "./modules/document-requests/documentRequest.routes";
import { documentVerifyRouter } from "./modules/document-verify/documentVerify.routes";
import { adminJobRouter, publicJobRouter } from "./modules/jobs/job.routes";
import { screeningQuestionRouter } from "./modules/screening-questions/screeningQuestion.routes";
import {
  adminApplicationRouter as adminJobApplicationRouter,
  publicApplicationRouter as publicJobApplicationRouter,
} from "./modules/applications/application.routes";
import { candidatePortalRouter } from "./modules/candidate-portal/candidatePortal.routes";
import { pipelineRouter } from "./modules/pipeline/pipeline.routes";
import { adminAssessmentRouter, publicAssessmentRouter } from "./modules/assessments/assessment.routes";
import { saasAuthRouter } from "./modules/saas/saasAuth/saasAuth.routes";
import { publicPackageRouter, adminPackageRouter } from "./modules/saas/packages/package.routes";
import { publicApplicationRouter, adminApplicationRouter } from "./modules/saas/applications/application.routes";
import { saasTenantRouter } from "./modules/saas/tenants/saasTenant.routes";
import { statsRouter } from "./modules/saas/stats/stats.routes";
import { siteSettingRouter } from "./modules/site-settings/siteSetting.routes";
import { siteSectionRouter } from "./modules/site-sections/siteSection.routes";
import { heroSlideRouter } from "./modules/hero-slides/heroSlide.routes";
import { companyServiceRouter } from "./modules/company-services/companyService.routes";
import { galleryItemRouter } from "./modules/gallery-items/galleryItem.routes";
import { blogPostRouter } from "./modules/blog-posts/blogPost.routes";
import {
  adminContactInquiryRouter,
  publicContactInquiryRouter,
} from "./modules/contact-inquiries/contactInquiry.routes";
import { socialLinkRouter } from "./modules/social-links/socialLink.routes";
import { legalPageRouter } from "./modules/legal-pages/legalPage.routes";
import { publicSiteContentRouter } from "./modules/site-content/siteContent.routes";
import { assetRouter } from "./modules/assets/asset.routes";
import { supportTicketRouter } from "./modules/support-tickets/supportTicket.routes";
import { ticketCategoryRouter } from "./modules/ticket-categories/ticketCategory.routes";
import { meetingRouter } from "./modules/meetings/meeting.routes";
import { schedulerSettingsRouter } from "./modules/scheduler-settings/schedulerSettings.routes";
import { saasSupportTicketRouter } from "./modules/saas/support-tickets/saasSupportTicket.routes";
import { saasTicketCategoryRouter } from "./modules/saas/ticket-categories/saasTicketCategory.routes";
import { adminLandingRouter, publicLandingRouter } from "./modules/saas/landing/saasLanding.routes";
import { adminSaasBlogRouter, publicSaasBlogRouter } from "./modules/saas/blog/saasBlogPost.routes";
import { adminSaasContactRouter, publicSaasContactRouter } from "./modules/saas/contact/saasContact.routes";
import { payCycleRouter } from "./modules/payroll/payCycle.routes";
import { payRateRouter } from "./modules/payroll/payRate.routes";
import { payrollSettingsRouter } from "./modules/payroll/payrollSettings.routes";
import { workReportRouter } from "./modules/payroll/workReport.routes";
import { payrollRunRouter } from "./modules/payroll/payrollRun.routes";
import { payslipRouter } from "./modules/payroll/payslip.routes";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || corsOrigins.includes(origin) || isTenantOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    })
  );
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
  app.use("/api/general-settings", tenantResolver, generalSettingsRouter);
  app.use("/api/ai-settings", tenantResolver, aiSettingsRouter);
  app.use("/api/document-categories", tenantResolver, documentCategoryRouter);
  app.use("/api/document-templates", tenantResolver, documentTemplateRouter);
  app.use("/api/document-requests", tenantResolver, documentRequestRouter);
  app.use("/api/document-verify", tenantResolver, documentVerifyRouter); // public — no requireAuth
  app.use("/api/assets", tenantResolver, assetRouter);
  app.use("/api/public/jobs", tenantResolver, publicJobRouter); // public — no requireAuth
  app.use("/api/jobs", tenantResolver, adminJobRouter);
  app.use("/api/screening-questions", tenantResolver, screeningQuestionRouter);
  app.use("/api/public/applications", tenantResolver, publicJobApplicationRouter); // public — no requireAuth
  app.use("/api/applications", tenantResolver, adminJobApplicationRouter);
  app.use("/api/public/candidate-portal", tenantResolver, candidatePortalRouter); // public — token auth, no requireAuth
  app.use("/api/pipeline", tenantResolver, pipelineRouter);
  app.use("/api/assessments", tenantResolver, adminAssessmentRouter);
  app.use("/api/public/assessment", tenantResolver, publicAssessmentRouter); // public — token auth, no requireAuth
  app.use("/api/support-tickets", tenantResolver, supportTicketRouter);
  app.use("/api/ticket-categories", tenantResolver, ticketCategoryRouter);
  app.use("/api/meetings", tenantResolver, meetingRouter);
  app.use("/api/scheduler-settings", tenantResolver, schedulerSettingsRouter);

  // Payroll module — separation of duties: HR approves hours, Payroll processes
  // runs, Finance (or Admin) approves payment.
  app.use("/api/pay-cycles", tenantResolver, payCycleRouter);
  app.use("/api/pay-rates", tenantResolver, payRateRouter);
  app.use("/api/payroll-settings", tenantResolver, payrollSettingsRouter);
  app.use("/api/work-reports", tenantResolver, workReportRouter);
  app.use("/api/payroll-runs", tenantResolver, payrollRunRouter);
  app.use("/api/payslips", tenantResolver, payslipRouter);

  // Public website CMS
  app.use("/api/site-settings", tenantResolver, siteSettingRouter);
  app.use("/api/site-sections", tenantResolver, siteSectionRouter);
  app.use("/api/hero-slides", tenantResolver, heroSlideRouter);
  app.use("/api/company-services", tenantResolver, companyServiceRouter);
  app.use("/api/gallery-items", tenantResolver, galleryItemRouter);
  app.use("/api/blog-posts", tenantResolver, blogPostRouter);
  app.use("/api/public/contact-inquiries", tenantResolver, publicContactInquiryRouter); // public — rate-limited, no requireAuth
  app.use("/api/contact-inquiries", tenantResolver, adminContactInquiryRouter);
  app.use("/api/social-links", tenantResolver, socialLinkRouter);
  app.use("/api/legal-pages", tenantResolver, legalPageRouter);
  app.use("/api/public/site-content", tenantResolver, publicSiteContentRouter); // public — no requireAuth, cached

  // SaaS control-plane API (public landing/signup + super-admin portal)
  app.use("/saas/admin/auth", saasAuthRouter);
  app.use("/saas/public/packages", publicPackageRouter);
  app.use("/saas/public/applications", publicApplicationRouter);
  app.use("/saas/admin/packages", adminPackageRouter);
  app.use("/saas/admin/applications", adminApplicationRouter);
  app.use("/saas/admin/tenants", saasTenantRouter);
  app.use("/saas/admin/stats", statsRouter);
  app.use("/saas/admin/support-tickets", saasSupportTicketRouter);
  app.use("/saas/admin/ticket-categories", saasTicketCategoryRouter);
  app.use("/saas/public/landing-content", publicLandingRouter);
  app.use("/saas/admin/landing", adminLandingRouter);
  app.use("/saas/public/blog", publicSaasBlogRouter);
  app.use("/saas/admin/blog", adminSaasBlogRouter);
  app.use("/saas/public/contact", publicSaasContactRouter);
  app.use("/saas/admin/contact", adminSaasContactRouter);

  app.use(errorHandler);

  return app;
}
