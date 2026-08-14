import { Queue } from "bullmq";
import { redisConnection } from "./redisConnection";

export const ASSET_EXPIRY_REMINDER_QUEUE = "asset-expiry-reminder";

let queue: Queue | undefined;

function getAssetExpiryReminderQueue(): Queue {
  if (!queue) {
    queue = new Queue(ASSET_EXPIRY_REMINDER_QUEUE, { connection: redisConnection });
  }
  return queue;
}

/**
 * Registers the daily repeatable job. BullMQ repeatable jobs are deduped by
 * jobId + repeat pattern, so calling this on every process boot is safe/idempotent.
 */
export async function scheduleAssetExpiryReminderJob(): Promise<void> {
  await getAssetExpiryReminderQueue().add(
    "daily-check",
    {},
    {
      jobId: "asset-expiry-reminder-daily",
      repeat: { pattern: "0 6 * * *" },
      removeOnComplete: true,
      removeOnFail: 50,
    }
  );
}
