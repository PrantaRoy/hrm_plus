import { PrismaClient } from "../../generated/tenant";

const JS_WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function loadWeekendNames(prisma: PrismaClient): Promise<Set<string>> {
  const weekDays = await prisma.weekDay.findMany();
  if (weekDays.length === 0) {
    // No WeekDay rows configured yet: fall back to the calendar-standard Sat/Sun weekend.
    return new Set(["Saturday", "Sunday"]);
  }
  return new Set(weekDays.filter((w) => w.isWeekend).map((w) => w.name));
}

export function isWeekendDate(weekendNames: Set<string>, date: Date): boolean {
  return weekendNames.has(JS_WEEKDAY_NAMES[date.getUTCDay()]);
}
