import { PrismaClient } from "../../../generated/tenant";
import { RecurrenceFrequency } from "@hrm-plus/shared";
import { controlClient } from "../../db/controlClient";
import { getTenantClient } from "../../db/tenantClientPool";
import { logger } from "../../logger";
import { recalculateProjectProgress } from "../projects/projectProgress";
import { addInterval } from "./recurrence";
import { createTaskWithNumber } from "./taskNumber.service";

// A recurring parent is skipped while it (or its project) is closed; its remaining cycles
// are kept so they resume if the task/project is reopened.
const CLOSED_PROJECT_STATUSES = ["cancelled", "completed", "archived"];

/**
 * Spawns at most one cycle of a recurring parent task, atomically.
 * Returns true if a cycle was created, false if nothing was due (or another worker won the race).
 */
async function generateNextCycle(prisma: PrismaClient, parentId: number, now: Date): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const parent = await tx.task.findUnique({
      where: { id: parentId },
      include: {
        project: { select: { status: true } },
        members: { select: { employeeId: true } },
        followers: { select: { employeeId: true } },
        checklists: { select: { title: true } },
      },
    });

    if (
      !parent ||
      parent.recurrenceFrequency === "none" ||
      parent.totalCycles <= 0 ||
      !parent.nextRecurrenceAt ||
      parent.nextRecurrenceAt > now ||
      parent.status === "cancelled" ||
      CLOSED_PROJECT_STATUSES.includes(parent.project.status)
    ) {
      return false;
    }

    const frequency = parent.recurrenceFrequency as RecurrenceFrequency;
    const cycleAt = parent.nextRecurrenceAt;
    const remaining = parent.totalCycles - 1;

    // Claim the cycle. The WHERE pins the exact totalCycles/nextRecurrenceAt we read, so if a
    // concurrent worker already claimed it the update matches 0 rows and we back off.
    const claimed = await tx.task.updateMany({
      where: { id: parent.id, totalCycles: parent.totalCycles, nextRecurrenceAt: cycleAt },
      data: {
        totalCycles: { decrement: 1 },
        nextRecurrenceAt: remaining > 0 ? addInterval(cycleAt, frequency, parent.recurrenceIntervalDays) : null,
      },
    });
    if (claimed.count === 0) return false;

    // Keep the parent's created->due offset: the cycle is due the same distance after it is spawned.
    const dueDate = parent.dueDate
      ? new Date(parent.dueDate.getTime() + (cycleAt.getTime() - parent.createdAt.getTime()))
      : null;

    const child = await createTaskWithNumber(tx, {
      projectId: parent.projectId,
      title: parent.title,
      priority: parent.priority,
      status: "to_do",
      timeType: parent.timeType,
      budgetAmount: parent.budgetAmount,
      // Cycles never recur themselves; only the parent carries the schedule.
      recurrenceFrequency: "none",
      recurrenceIntervalDays: null,
      totalCycles: 0,
      nextRecurrenceAt: null,
      recurrenceParentId: parent.id,
      cycleAt,
      supervisorId: parent.supervisorId,
      description: parent.description,
      progressPercentage: 0,
      dueDate,
      createdById: parent.createdById,
    });

    if (parent.members.length) {
      await tx.taskMember.createMany({
        data: parent.members.map((m) => ({ taskId: child.id, employeeId: m.employeeId })),
      });
    }
    if (parent.followers.length) {
      await tx.taskFollower.createMany({
        data: parent.followers.map((f) => ({ taskId: child.id, employeeId: f.employeeId })),
      });
    }
    if (parent.checklists.length) {
      // Fresh cycle: items come back unticked and unverified (the column defaults).
      await tx.checklist.createMany({
        data: parent.checklists.map((c) => ({ taskId: child.id, title: c.title })),
      });
    }

    await recalculateProjectProgress(tx, parent.projectId);
    return true;
  });
}

/**
 * Generates every due recurring-task cycle in one tenant database. `now` is injectable so
 * tests can drive the clock. Returns how many tasks were created.
 *
 * Idempotent: a cycle is claimed by decrementing `totalCycles` and advancing
 * `nextRecurrenceAt` in the same transaction that creates the child, and
 * @@unique([recurrenceParentId, cycleAt]) rejects a duplicate cycle. Missed runs
 * (worker downtime) are caught up, bounded by the parent's remaining `totalCycles`.
 */
export async function runRecurringTaskGenerationForTenant(
  prisma: PrismaClient,
  now: Date = new Date()
): Promise<number> {
  const due = await prisma.task.findMany({
    where: {
      totalCycles: { gt: 0 },
      recurrenceFrequency: { not: "none" },
      nextRecurrenceAt: { lte: now },
      status: { not: "cancelled" },
      project: { status: { notIn: CLOSED_PROJECT_STATUSES } },
    },
    select: { id: true },
    orderBy: { id: "asc" },
  });

  let created = 0;
  for (const { id } of due) {
    try {
      while (await generateNextCycle(prisma, id, now)) created++;
    } catch (err) {
      // One misconfigured parent must not block the others.
      logger.error({ err, taskId: id }, "Recurring task generation failed for task");
    }
  }
  return created;
}

/** Runs the generation for every active tenant; a failing tenant never stops the rest. */
export async function runRecurringTaskGeneration(): Promise<void> {
  const tenants = await controlClient.tenant.findMany({ where: { status: "Active" } });
  for (const tenant of tenants) {
    const prisma = getTenantClient(tenant.databaseName);
    await runRecurringTaskGenerationForTenant(prisma)
      .then((created) => {
        if (created > 0) logger.info({ tenantSlug: tenant.slug, created }, "Recurring tasks generated");
      })
      .catch((err) => logger.error({ err, tenantSlug: tenant.slug }, "Recurring task generation failed for tenant"));
  }
}
