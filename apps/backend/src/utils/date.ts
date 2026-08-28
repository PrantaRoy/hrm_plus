export function toDateOnlyUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function combineDateAndTimeUTC(date: Date, hhmm: string): Date {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hours, minutes, 0, 0));
}

// How far `timeZone`'s wall clock is ahead of UTC, in minutes, at the instant `date`.
// Uses Intl instead of a library so this stays dependency-free and DST-correct.
function getTimezoneOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }

  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour) % 24,
    Number(map.minute),
    Number(map.second)
  );
  return (asUTC - date.getTime()) / 60_000;
}

// Converts a wall-clock "HH:mm" on `date`'s calendar day, as understood in `timeZone`,
// into the correct UTC instant — unlike combineDateAndTimeUTC, which silently treats
// the "HH:mm" as if it were already UTC (wrong for any tenant not physically in UTC+0).
// Runs the offset lookup twice so a DST transition landing on the target day doesn't
// throw the result off by an hour.
export function combineDateAndTimeInZone(date: Date, hhmm: string, timeZone: string): Date {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const guess = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hours, minutes, 0, 0));
  const offset1 = getTimezoneOffsetMinutes(guess, timeZone);
  const corrected = new Date(guess.getTime() - offset1 * 60_000);
  const offset2 = getTimezoneOffsetMinutes(corrected, timeZone);
  return offset2 === offset1 ? corrected : new Date(guess.getTime() - offset2 * 60_000);
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function enumerateDateKeys(startDate: Date, endDate: Date): string[] {
  const keys: string[] = [];
  const cursor = toDateOnlyUTC(startDate);
  const end = toDateOnlyUTC(endDate);
  while (cursor.getTime() <= end.getTime()) {
    keys.push(toDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}
