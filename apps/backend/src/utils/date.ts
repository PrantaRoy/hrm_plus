export function toDateOnlyUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
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
