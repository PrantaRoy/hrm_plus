const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

type Unit = "second" | "minute" | "hour" | "day" | "week" | "month" | "year";

const THRESHOLDS: [number, Unit, number][] = [
  [60, "second", 1],
  [60 * 60, "minute", 60],
  [60 * 60 * 24, "hour", 60 * 60],
  [60 * 60 * 24 * 7, "day", 60 * 60 * 24],
  [60 * 60 * 24 * 30, "week", 60 * 60 * 24 * 7],
  [60 * 60 * 24 * 365, "month", 60 * 60 * 24 * 30],
  [Infinity, "year", 60 * 60 * 24 * 365],
];

export function timeAgo(isoDate: string): string {
  const seconds = (Date.now() - new Date(isoDate).getTime()) / 1000;
  if (seconds < 30) return "just now";

  const [, unit, divisor] = THRESHOLDS.find(([limit]) => seconds < limit) ?? THRESHOLDS[THRESHOLDS.length - 1];
  const value = Math.round(seconds / divisor);
  return rtf.format(-value, unit);
}
