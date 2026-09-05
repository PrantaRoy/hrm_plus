import { Worker } from "bullmq";
import { redisConnection } from "./queue/redisConnection";
import { ASSESSMENT_GRADING_QUEUE, AssessmentGradingJobData } from "./queue/assessmentGrading.queue";
import { ASSET_EXPIRY_REMINDER_QUEUE, scheduleAssetExpiryReminderJob } from "./queue/assetExpiryReminder.queue";
import { ASSESSMENT_EXPIRY_QUEUE, scheduleAssessmentExpiryCheckJob } from "./queue/assessmentExpiry.queue";
import { PAYSLIP_PDF_QUEUE, PayslipPdfJobData } from "./queue/payslipPdf.queue";
import { IRD_PAYDAY_FILING_QUEUE, IrdPaydayFilingJobData } from "./queue/irdPaydayFiling.queue";
import { controlClient } from "./db/controlClient";
import { getTenantClient } from "./db/tenantClientPool";
import { gradeAssessmentAnswer } from "./modules/assessments/assessmentGrading.processor";
import { runAssetExpiryReminderCheck } from "./modules/assets/assetExpiryReminder.processor";
import { runAssessmentExpiryCheck } from "./modules/assessments/assessmentExpiry.processor";
import { processPayslipPdfJob } from "./modules/payroll/payslipPdf.processor";
import { processIrdPaydayFilingJob } from "./modules/payroll/irdPaydayFiling.processor";
import { env } from "./config/env";
import { logger } from "./logger";

const worker = new Worker<AssessmentGradingJobData>(
  ASSESSMENT_GRADING_QUEUE,
  async (job) => {
    const tenant = await controlClient.tenant.findUnique({ where: { slug: job.data.tenantSlug } });
    if (!tenant) {
      throw new Error(`Unknown tenant slug: ${job.data.tenantSlug}`);
    }
    await gradeAssessmentAnswer(getTenantClient(tenant.databaseName), job.data.answerId);
  },
  { connection: redisConnection, concurrency: Number(env.ASSESSMENT_GRADING_CONCURRENCY) }
);

worker.on("completed", (job) => {
  logger.info({ jobId: job.id, answerId: job.data.answerId }, "Assessment grading job completed");
});

worker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, answerId: job?.data.answerId, err }, "Assessment grading job failed");
});

logger.info("Assessment grading worker started");

const assetExpiryReminderWorker = new Worker(
  ASSET_EXPIRY_REMINDER_QUEUE,
  async () => {
    await runAssetExpiryReminderCheck();
  },
  { connection: redisConnection }
);

assetExpiryReminderWorker.on("completed", () => {
  logger.info("Asset expiry reminder check completed");
});

assetExpiryReminderWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Asset expiry reminder check failed");
});

scheduleAssetExpiryReminderJob()
  .then(() => logger.info("Asset expiry reminder daily job scheduled"))
  .catch((err) => logger.error({ err }, "Failed to schedule asset expiry reminder job"));

logger.info("Asset expiry reminder worker started");

const assessmentExpiryWorker = new Worker(
  ASSESSMENT_EXPIRY_QUEUE,
  async () => {
    await runAssessmentExpiryCheck();
  },
  { connection: redisConnection }
);

assessmentExpiryWorker.on("completed", () => {
  logger.debug("Assessment expiry check completed");
});

assessmentExpiryWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Assessment expiry check failed");
});

scheduleAssessmentExpiryCheckJob()
  .then(() => logger.info("Assessment expiry every-minute job scheduled"))
  .catch((err) => logger.error({ err }, "Failed to schedule assessment expiry job"));

logger.info("Assessment expiry worker started");

async function resolveTenant(tenantSlug: string) {
  const tenant = await controlClient.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) throw new Error(`Unknown tenant slug: ${tenantSlug}`);
  return tenant;
}

const payslipPdfWorker = new Worker<PayslipPdfJobData>(
  PAYSLIP_PDF_QUEUE,
  async (job) => {
    const tenant = await resolveTenant(job.data.tenantSlug);
    await processPayslipPdfJob(getTenantClient(tenant.databaseName), job.data.payslipId, tenant.name);
  },
  { connection: redisConnection }
);

payslipPdfWorker.on("completed", (job) => {
  logger.info({ jobId: job.id, payslipId: job.data.payslipId }, "Payslip PDF job completed");
});

payslipPdfWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, payslipId: job?.data.payslipId, err }, "Payslip PDF job failed");
});

logger.info("Payslip PDF worker started");

const irdPaydayFilingWorker = new Worker<IrdPaydayFilingJobData>(
  IRD_PAYDAY_FILING_QUEUE,
  async (job) => {
    const tenant = await resolveTenant(job.data.tenantSlug);
    await processIrdPaydayFilingJob(getTenantClient(tenant.databaseName), job.data.payrollRunId);
  },
  { connection: redisConnection }
);

irdPaydayFilingWorker.on("completed", (job) => {
  logger.info({ jobId: job.id, payrollRunId: job.data.payrollRunId }, "IRD payday filing job completed");
});

irdPaydayFilingWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, payrollRunId: job?.data.payrollRunId, err }, "IRD payday filing job failed");
});

logger.info("IRD payday filing worker started");
