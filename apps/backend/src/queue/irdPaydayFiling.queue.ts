import { Queue } from "bullmq";
import { redisConnection } from "./redisConnection";

export const IRD_PAYDAY_FILING_QUEUE = "ird-payday-filing";

export interface IrdPaydayFilingJobData {
  tenantSlug: string;
  payrollRunId: number;
}

let queue: Queue<IrdPaydayFilingJobData> | undefined;

function getIrdPaydayFilingQueue(): Queue<IrdPaydayFilingJobData> {
  if (!queue) {
    queue = new Queue<IrdPaydayFilingJobData>(IRD_PAYDAY_FILING_QUEUE, { connection: redisConnection });
  }
  return queue;
}

export async function enqueueIrdPaydayFilingJob(data: IrdPaydayFilingJobData): Promise<void> {
  await getIrdPaydayFilingQueue().add("prepare", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: true,
    removeOnFail: 100,
  });
}
