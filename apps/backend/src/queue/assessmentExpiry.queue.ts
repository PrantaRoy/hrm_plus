import { Queue } from "bullmq";
import { redisConnection } from "./redisConnection";

export const ASSESSMENT_EXPIRY_QUEUE = "assessment-expiry";

let queue: Queue | undefined;

function getAssessmentExpiryQueue(): Queue {
  if (!queue) {
    queue = new Queue(ASSESSMENT_EXPIRY_QUEUE, { connection: redisConnection });
  }
  return queue;
}

/**
 * Registers the every-minute sweep. Exams run in minutes, not days, so this needs a
 * much tighter cadence than the daily asset-expiry job — it's only the safety net for
 * an abandoned tab; the synchronous check in assessment.service.ts catches an expired
 * invitation immediately on the candidate's next request regardless. BullMQ repeatable
 * jobs are deduped by jobId + repeat pattern, so calling this on every process boot is safe.
 */
export async function scheduleAssessmentExpiryCheckJob(): Promise<void> {
  await getAssessmentExpiryQueue().add(
    "every-minute-check",
    {},
    {
      jobId: "assessment-expiry-every-minute",
      repeat: { pattern: "*/1 * * * *" },
      removeOnComplete: true,
      removeOnFail: 50,
    }
  );
}
