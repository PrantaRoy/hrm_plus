import { Worker } from "bullmq";
import { redisConnection } from "./queue/redisConnection";
import { ASSESSMENT_GRADING_QUEUE, AssessmentGradingJobData } from "./queue/assessmentGrading.queue";
import { controlClient } from "./db/controlClient";
import { getTenantClient } from "./db/tenantClientPool";
import { gradeAssessmentAnswer } from "./modules/assessments/assessmentGrading.processor";
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
