import { addInterval, resolveRecurrence } from "../modules/tasks/recurrence";
import { ApiError } from "../utils/ApiError";

const iso = (d: Date) => d.toISOString();

describe("addInterval", () => {
  const base = new Date("2026-01-15T10:30:00.000Z");

  it("adds fixed day counts for daily, weekly and fortnightly", () => {
    expect(iso(addInterval(base, "daily"))).toBe("2026-01-16T10:30:00.000Z");
    expect(iso(addInterval(base, "weekly"))).toBe("2026-01-22T10:30:00.000Z");
    expect(iso(addInterval(base, "fortnightly"))).toBe("2026-01-29T10:30:00.000Z");
  });

  it("adds calendar months and clamps to the last day of shorter months", () => {
    expect(iso(addInterval(base, "monthly"))).toBe("2026-02-15T10:30:00.000Z");
    expect(iso(addInterval(new Date("2026-01-31T00:00:00.000Z"), "monthly"))).toBe("2026-02-28T00:00:00.000Z");
    expect(iso(addInterval(new Date("2028-01-31T00:00:00.000Z"), "monthly"))).toBe("2028-02-29T00:00:00.000Z");
    expect(iso(addInterval(new Date("2026-03-31T00:00:00.000Z"), "monthly"))).toBe("2026-04-30T00:00:00.000Z");
    expect(iso(addInterval(new Date("2026-12-31T00:00:00.000Z"), "monthly"))).toBe("2027-01-31T00:00:00.000Z");
  });

  it("adds a year and handles Feb 29", () => {
    expect(iso(addInterval(base, "yearly"))).toBe("2027-01-15T10:30:00.000Z");
    expect(iso(addInterval(new Date("2028-02-29T00:00:00.000Z"), "yearly"))).toBe("2029-02-28T00:00:00.000Z");
  });

  it("uses intervalDays for custom", () => {
    expect(iso(addInterval(base, "custom", 10))).toBe("2026-01-25T10:30:00.000Z");
  });

  it("does not mutate its input", () => {
    const copy = new Date(base.getTime());
    addInterval(base, "monthly");
    expect(base.getTime()).toBe(copy.getTime());
  });

  it("throws for custom without a valid interval and for none", () => {
    expect(() => addInterval(base, "custom")).toThrow();
    expect(() => addInterval(base, "custom", 0)).toThrow();
    expect(() => addInterval(base, "custom", 1.5)).toThrow();
    expect(() => addInterval(base, "none")).toThrow();
  });
});

describe("resolveRecurrence", () => {
  const now = new Date("2026-06-01T00:00:00.000Z");
  const existing = {
    frequency: "weekly" as const,
    intervalDays: null,
    totalCycles: 4,
    nextRecurrenceAt: new Date("2026-06-03T00:00:00.000Z"),
  };

  it("clears everything for frequency none", () => {
    expect(resolveRecurrence(existing, { frequency: "none" }, now)).toEqual({
      frequency: "none",
      intervalDays: null,
      totalCycles: 0,
      nextRecurrenceAt: null,
    });
  });

  it("schedules one step after now when newly enabled", () => {
    const state = resolveRecurrence(null, { frequency: "daily", totalCycles: 3 }, now);
    expect(state.totalCycles).toBe(3);
    expect(iso(state.nextRecurrenceAt!)).toBe("2026-06-02T00:00:00.000Z");
  });

  it("schedules nothing when there are no cycles", () => {
    const state = resolveRecurrence(null, { frequency: "daily", totalCycles: 0 }, now);
    expect(state.nextRecurrenceAt).toBeNull();
  });

  it("keeps the existing schedule when only totalCycles changes", () => {
    const state = resolveRecurrence(existing, { totalCycles: 10 }, now);
    expect(state.totalCycles).toBe(10);
    expect(state.nextRecurrenceAt).toEqual(existing.nextRecurrenceAt);
  });

  it("re-anchors on now when the frequency changes", () => {
    const state = resolveRecurrence(existing, { frequency: "daily" }, now);
    expect(iso(state.nextRecurrenceAt!)).toBe("2026-06-02T00:00:00.000Z");
  });

  it("re-arms an exhausted task when cycles are added again", () => {
    const exhausted = { ...existing, totalCycles: 0, nextRecurrenceAt: null };
    const state = resolveRecurrence(exhausted, { totalCycles: 2 }, now);
    expect(iso(state.nextRecurrenceAt!)).toBe("2026-06-08T00:00:00.000Z");
  });

  it("requires an interval for custom frequency", () => {
    expect(() => resolveRecurrence(null, { frequency: "custom", totalCycles: 2 }, now)).toThrow(ApiError);
    const state = resolveRecurrence(null, { frequency: "custom", intervalDays: 3, totalCycles: 2 }, now);
    expect(iso(state.nextRecurrenceAt!)).toBe("2026-06-04T00:00:00.000Z");
    expect(state.intervalDays).toBe(3);
  });

  it("drops a stale interval when switching away from custom", () => {
    const custom = { frequency: "custom" as const, intervalDays: 9, totalCycles: 2, nextRecurrenceAt: now };
    expect(resolveRecurrence(custom, { frequency: "weekly" }, now).intervalDays).toBeNull();
  });
});
