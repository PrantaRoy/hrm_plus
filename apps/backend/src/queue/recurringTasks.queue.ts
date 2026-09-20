import { Queue } from "bullmq";
import { redisConnection } from "./redisConnection";

export const RECURRING_TASKS_QUEUE = "recurring-tasks";

let queue: Queue | undefined;

function getRecurringTasksQueue(): Queue {
  if (!queue) {
    queue = new Queue(RECURRING_TASKS_QUEUE, { connection: redisConnection });
  }
  return queue;
}

/**
 * Registers the daily repeatable job. BullMQ repeatable jobs are deduped by
 * jobId + repeat pattern, so calling this on every process boot is safe/idempotent.
 */
export async function scheduleRecurringTasksJob(): Promise<void> {
  await getRecurringTasksQueue().add(
    "daily-generate",
    {},
    {
      jobId: "recurring-tasks-daily",
      repeat: { pattern: "30 0 * * *" },
      removeOnComplete: true,
      removeOnFail: 50,
    }
  );
}
