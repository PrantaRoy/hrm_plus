import { PrismaClient } from "../../../generated/tenant";
import { prepareIrdPaydayFiling } from "./irdPaydayFiling";

export async function processIrdPaydayFilingJob(prisma: PrismaClient, payrollRunId: number): Promise<void> {
  await prepareIrdPaydayFiling(prisma, payrollRunId);
}
