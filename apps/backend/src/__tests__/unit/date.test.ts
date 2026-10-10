import {
  addMinutes,
  combineDateAndTimeInZone,
  combineDateAndTimeUTC,
  enumerateDateKeys,
  toDateKey,
  toDateOnlyUTC,
} from "../../utils/date";

describe("toDateOnlyUTC", () => {
  it("drops the time portion in UTC", () => {
    expect(toDateOnlyUTC(new Date("2026-03-05T23:59:59.999Z")).toISOString()).toBe("2026-03-05T00:00:00.000Z");
  });
  it("is idempotent", () => {
    const once = toDateOnlyUTC(new Date("2026-03-05T13:00:00Z"));
    expect(toDateOnlyUTC(once).getTime()).toBe(once.getTime());
  });
});

describe("addMinutes", () => {
  it("adds and subtracts minutes without mutating the input", () => {
    const base = new Date("2026-01-01T00:00:00Z");
    expect(addMinutes(base, 90).toISOString()).toBe("2026-01-01T01:30:00.000Z");
    expect(addMinutes(base, -30).toISOString()).toBe("2025-12-31T23:30:00.000Z");
    expect(base.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("combineDateAndTimeUTC", () => {
  it("applies HH:mm to the UTC calendar day", () => {
    expect(combineDateAndTimeUTC(new Date("2026-06-10T18:45:00Z"), "09:30").toISOString()).toBe("2026-06-10T09:30:00.000Z");
  });
});

describe("combineDateAndTimeInZone", () => {
  const day = new Date("2026-01-15T00:00:00Z");

  it("equals the UTC combine for the UTC zone", () => {
    expect(combineDateAndTimeInZone(day, "09:00", "UTC").toISOString()).toBe("2026-01-15T09:00:00.000Z");
  });

  it("converts a zone ahead of UTC (Asia/Dhaka, UTC+6, no DST)", () => {
    expect(combineDateAndTimeInZone(day, "09:00", "Asia/Dhaka").toISOString()).toBe("2026-01-15T03:00:00.000Z");
  });

  it("converts a zone behind UTC and can roll to the previous UTC day", () => {
    // New York is UTC-5 in January.
    expect(combineDateAndTimeInZone(day, "20:00", "America/New_York").toISOString()).toBe("2026-01-16T01:00:00.000Z");
  });

  it("uses the DST-correct offset (Pacific/Auckland: +13 in January, +12 in July)", () => {
    expect(combineDateAndTimeInZone(day, "09:00", "Pacific/Auckland").toISOString()).toBe("2026-01-14T20:00:00.000Z");
    expect(combineDateAndTimeInZone(new Date("2026-07-15T00:00:00Z"), "09:00", "Pacific/Auckland").toISOString()).toBe(
      "2026-07-14T21:00:00.000Z"
    );
  });

  it("stays correct on the day of a DST transition (US spring forward, 2026-03-08)", () => {
    const transitionDay = new Date("2026-03-08T00:00:00Z");
    // 01:00 EST is before the 02:00 jump -> UTC-5 ; 12:00 is after -> UTC-4.
    expect(combineDateAndTimeInZone(transitionDay, "01:00", "America/New_York").toISOString()).toBe("2026-03-08T06:00:00.000Z");
    expect(combineDateAndTimeInZone(transitionDay, "12:00", "America/New_York").toISOString()).toBe("2026-03-08T16:00:00.000Z");
  });
});

describe("toDateKey / enumerateDateKeys", () => {
  it("formats YYYY-MM-DD", () => {
    expect(toDateKey(new Date("2026-12-31T23:59:59Z"))).toBe("2026-12-31");
  });

  it("enumerates inclusive ranges and ignores time-of-day", () => {
    expect(enumerateDateKeys(new Date("2026-02-27T22:00:00Z"), new Date("2026-03-02T01:00:00Z"))).toEqual([
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
      "2026-03-02",
    ]);
  });

  it("returns a single key when start and end are the same day", () => {
    expect(enumerateDateKeys(new Date("2026-05-05T00:00:00Z"), new Date("2026-05-05T23:00:00Z"))).toEqual(["2026-05-05"]);
  });

  it("returns an empty list when start is after end", () => {
    expect(enumerateDateKeys(new Date("2026-05-06T00:00:00Z"), new Date("2026-05-05T00:00:00Z"))).toEqual([]);
  });
});
