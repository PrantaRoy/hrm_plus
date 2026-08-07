import { Queue } from "bullmq";
import { redisConnection } from "./redisConnection";

export const ASSESSMENT_GRADING_QUEUE = "assessment-grading";

export interface AssessmentGradingJobData {
  tenantSlug: string;
  answerId: number;
}

let queue: Queue<AssessmentGradingJobData> | undefined;

function getAssessmentGradingQueue(): Queue<AssessmentGradingJobData> {
  if (!queue) {
    queue = new Queue<AssessmentGradingJobData>(ASSESSMENT_GRADING_QUEUE, { connection: redisConnection });
  }
  return queue;
}

export async function enqueueAssessmentGradingJob(data: AssessmentGradingJobData): Promise<void> {
  await getAssessmentGradingQueue().add("grade", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: true,
    removeOnFail: 100,
  });
}
