import { Prisma, PrismaClient } from "../../../generated/tenant";

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Project progress = rounded mean of the progress of its non-cancelled tasks.
 * A project with no active tasks reports 0.
 */
export async function recalculateProjectProgress(db: Db, projectId: number): Promise<number> {
  const agg = await db.task.aggregate({
    where: { projectId, status: { not: "cancelled" } },
    _avg: { progressPercentage: true },
  });
  const progress = Math.round(agg._avg.progressPercentage ?? 0);
  await db.project.update({ where: { id: projectId }, data: { progressPercentage: progress } });
  return progress;
}
