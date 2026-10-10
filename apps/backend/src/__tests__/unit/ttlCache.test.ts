import { createTtlCache } from "../../utils/ttlCache";

describe("createTtlCache", () => {
  beforeEach(() => jest.useFakeTimers().setSystemTime(new Date("2026-01-01T00:00:00Z")));
  afterEach(() => jest.useRealTimers());

  it("returns undefined for unknown keys", () => {
    expect(createTtlCache<number>(1000).get("nope")).toBeUndefined();
  });

  it("returns a stored value until the TTL elapses", () => {
    const cache = createTtlCache<string>(1000);
    cache.set("k", "v");
    expect(cache.get("k")).toBe("v");
    jest.advanceTimersByTime(1000);
    expect(cache.get("k")).toBe("v"); // boundary: still valid at exactly ttl
    jest.advanceTimersByTime(1);
    expect(cache.get("k")).toBeUndefined();
  });

  it("re-setting a key restarts its TTL", () => {
    const cache = createTtlCache<string>(1000);
    cache.set("k", "a");
    jest.advanceTimersByTime(800);
    cache.set("k", "b");
    jest.advanceTimersByTime(800);
    expect(cache.get("k")).toBe("b");
  });

  it("keeps keys independent", () => {
    const cache = createTtlCache<number>(1000);
    cache.set("a", 1);
    jest.advanceTimersByTime(600);
    cache.set("b", 2);
    jest.advanceTimersByTime(600);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
  });

  it("clear() removes everything", () => {
    const cache = createTtlCache<number>(1000);
    cache.set("a", 1);
    cache.clear();
    expect(cache.get("a")).toBeUndefined();
  });

  it("caches falsy values correctly", () => {
    const cache = createTtlCache<number>(1000);
    cache.set("zero", 0);
    expect(cache.get("zero")).toBe(0);
  });
});
