import { taskDeadline } from "../../modules/ai-kpi-reports/kpiMetrics.service";

describe("taskDeadline", () => {
  it("treats a date-only (midnight UTC) due date as the end of that day", () => {
    expect(taskDeadline(new Date("2026-05-10T00:00:00.000Z")).toISOString()).toBe("2026-05-10T23:59:59.999Z");
  });

  it("uses a due date that carries a time as-is", () => {
    const due = new Date("2026-05-10T14:30:00.000Z");
    expect(taskDeadline(due).getTime()).toBe(due.getTime());
  });

  it("a task finished late on its due day is therefore on time", () => {
    expect(new Date("2026-05-10T22:00:00Z").getTime()).toBeLessThanOrEqual(taskDeadline(new Date("2026-05-10T00:00:00Z")).getTime());
    expect(new Date("2026-05-11T00:00:00Z").getTime()).toBeGreaterThan(taskDeadline(new Date("2026-05-10T00:00:00Z")).getTime());
  });

  it("does not treat one millisecond past midnight as date-only", () => {
    const due = new Date("2026-05-10T00:00:00.001Z");
    expect(taskDeadline(due).getTime()).toBe(due.getTime());
  });
});
