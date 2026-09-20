import { Prisma, PrismaClient, Task } from "../../../generated/tenant";

export type NewTaskData = Omit<Prisma.TaskUncheckedCreateInput, "taskNumber">;

async function issueNumberAndCreate(tx: Prisma.TransactionClient, data: NewTaskData): Promise<Task> {
  // The atomic increment issues `UPDATE Project SET taskSequence = taskSequence + 1`, which
  // takes an InnoDB row lock on the project that is held until this transaction commits.
  // Concurrent creators therefore queue up and each observes a distinct sequence value, and
  // a rolled-back create releases its number. Task.taskNumber @unique is the backstop.
  const project = await tx.project.update({
    where: { id: data.projectId },
    data: { taskSequence: { increment: 1 } },
    select: { code: true, taskSequence: true },
  });
  return tx.task.create({ data: { ...data, taskNumber: `${project.code}-${project.taskSequence}` } });
}

/**
 * The single write path for new tasks: allocates the next `<project.code>-<n>` number and
 * inserts the task atomically (first task in a project is `code-101`). Pass a transaction
 * client to compose it with other writes, or the plain client to get its own transaction.
 * Every code path that inserts a Task (API, recurring-task job) must go through here.
 */
export function createTaskWithNumber(
  db: PrismaClient | Prisma.TransactionClient,
  data: NewTaskData
): Promise<Task> {
  if ("$transaction" in db) {
    return db.$transaction((tx) => issueNumberAndCreate(tx, data));
  }
  return issueNumberAndCreate(db, data);
}
