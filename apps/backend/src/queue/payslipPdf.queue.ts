import { Queue } from "bullmq";
import { redisConnection } from "./redisConnection";

export const PAYSLIP_PDF_QUEUE = "payslip-pdf";

export interface PayslipPdfJobData {
  tenantSlug: string;
  payslipId: number;
}

let queue: Queue<PayslipPdfJobData> | undefined;

function getPayslipPdfQueue(): Queue<PayslipPdfJobData> {
  if (!queue) {
    queue = new Queue<PayslipPdfJobData>(PAYSLIP_PDF_QUEUE, { connection: redisConnection });
  }
  return queue;
}

export async function enqueuePayslipPdfJob(data: PayslipPdfJobData): Promise<void> {
  await getPayslipPdfQueue().add("generate", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: true,
    removeOnFail: 100,
  });
}
