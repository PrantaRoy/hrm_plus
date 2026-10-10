import { isWeekendDate, loadWeekendNames } from "../../utils/weekday";

const prismaWith = (rows: Array<{ name: string; isWeekend: boolean }>) =>
  ({ weekDay: { findMany: jest.fn().mockResolvedValue(rows) } }) as never;

describe("loadWeekendNames", () => {
  it("falls back to Saturday/Sunday when no WeekDay rows exist", async () => {
    expect(await loadWeekendNames(prismaWith([]))).toEqual(new Set(["Saturday", "Sunday"]));
  });

  it("returns only the configured weekend days", async () => {
    const names = await loadWeekendNames(
      prismaWith([
        { name: "Friday", isWeekend: true },
        { name: "Saturday", isWeekend: true },
        { name: "Sunday", isWeekend: false },
      ])
    );
    expect(names).toEqual(new Set(["Friday", "Saturday"]));
  });

  it("returns an empty set when rows exist but none are weekend (does not use the fallback)", async () => {
    expect(await loadWeekendNames(prismaWith([{ name: "Sunday", isWeekend: false }]))).toEqual(new Set());
  });
});

describe("isWeekendDate", () => {
  const weekend = new Set(["Friday", "Saturday"]);
  it("checks the UTC weekday name against the set", () => {
    expect(isWeekendDate(weekend, new Date("2026-01-02T12:00:00Z"))).toBe(true); // Friday
    expect(isWeekendDate(weekend, new Date("2026-01-03T00:00:00Z"))).toBe(true); // Saturday
    expect(isWeekendDate(weekend, new Date("2026-01-04T12:00:00Z"))).toBe(false); // Sunday
    expect(isWeekendDate(weekend, new Date("2026-01-05T12:00:00Z"))).toBe(false); // Monday
  });
});
