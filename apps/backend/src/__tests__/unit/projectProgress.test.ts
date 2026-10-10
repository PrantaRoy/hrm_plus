import { recalculateProjectProgress } from "../../modules/projects/projectProgress";

function makeDb(avg: number | null) {
  return {
    task: { aggregate: jest.fn().mockResolvedValue({ _avg: { progressPercentage: avg } }) },
    project: { update: jest.fn().mockResolvedValue({}) },
  };
}

describe("recalculateProjectProgress", () => {
  it("averages the non-cancelled tasks and persists the rounded value", async () => {
    const db = makeDb(66.6667);
    await expect(recalculateProjectProgress(db as never, 7)).resolves.toBe(67);
    expect(db.task.aggregate).toHaveBeenCalledWith({
      where: { projectId: 7, status: { not: "cancelled" } },
      _avg: { progressPercentage: true },
    });
    expect(db.project.update).toHaveBeenCalledWith({ where: { id: 7 }, data: { progressPercentage: 67 } });
  });

  it("reports 0 for a project with no active tasks", async () => {
    const db = makeDb(null);
    await expect(recalculateProjectProgress(db as never, 1)).resolves.toBe(0);
    expect(db.project.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { progressPercentage: 0 } });
  });

  it.each([
    [49.5, 50],
    [49.4, 49],
    [100, 100],
    [0, 0],
  ])("rounds %d -> %d", async (avg, expected) => {
    await expect(recalculateProjectProgress(makeDb(avg) as never, 1)).resolves.toBe(expected);
  });
});
