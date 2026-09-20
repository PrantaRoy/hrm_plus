import { RecurrenceFrequency } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Adds calendar months in UTC, clamping to the last day of the target month (Jan 31 + 1 month = Feb 28/29). */
function addMonthsUtc(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDayOfMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
  ).getUTCDate();
  result.setUTCDate(Math.min(day, lastDayOfMonth));
  return result;
}

/**
 * The instant one recurrence step after `date`. "custom" uses `intervalDays`.
 * Throws for "none" and for a "custom" step without a positive whole-number interval,
 * since neither has a next occurrence.
 */
export function addInterval(
  date: Date,
  frequency: RecurrenceFrequency,
  intervalDays?: number | null
): Date {
  switch (frequency) {
    case "daily":
      return new Date(date.getTime() + DAY_MS);
    case "weekly":
      return new Date(date.getTime() + 7 * DAY_MS);
    case "fortnightly":
      return new Date(date.getTime() + 14 * DAY_MS);
    case "monthly":
      return addMonthsUtc(date, 1);
    case "yearly":
      return addMonthsUtc(date, 12);
    case "custom":
      if (!intervalDays || !Number.isInteger(intervalDays) || intervalDays < 1) {
        throw new Error("Custom recurrence requires a positive whole-number interval in days");
      }
      return new Date(date.getTime() + intervalDays * DAY_MS);
    default:
      throw new Error(`Frequency "${frequency}" has no next occurrence`);
  }
}

export interface RecurrenceState {
  frequency: RecurrenceFrequency;
  intervalDays: number | null;
  totalCycles: number;
  nextRecurrenceAt: Date | null;
}

export interface RecurrencePatch {
  frequency?: RecurrenceFrequency;
  intervalDays?: number | null;
  totalCycles?: number;
}

/**
 * Merges a create/update patch into the task's recurrence config and works out when the
 * recurring-task job should spawn the next cycle:
 *  - "none" or no cycles left  -> nothing scheduled
 *  - schedule unchanged        -> keep the existing `nextRecurrenceAt`
 *  - newly enabled / re-armed  -> one step after `now`
 */
export function resolveRecurrence(
  existing: RecurrenceState | null,
  patch: RecurrencePatch,
  now: Date
): RecurrenceState {
  const frequency = patch.frequency ?? existing?.frequency ?? "none";
  if (frequency === "none") {
    return { frequency, intervalDays: null, totalCycles: 0, nextRecurrenceAt: null };
  }

  const intervalDays =
    frequency === "custom"
      ? patch.intervalDays !== undefined
        ? patch.intervalDays
        : (existing?.intervalDays ?? null)
      : null;
  if (frequency === "custom" && (!intervalDays || intervalDays < 1)) {
    throw ApiError.badRequest(
      "recurrenceIntervalDays is required when recurrenceFrequency is custom",
      "RECURRENCE_INTERVAL_REQUIRED"
    );
  }

  const totalCycles = patch.totalCycles ?? existing?.totalCycles ?? 0;
  if (totalCycles <= 0) {
    return { frequency, intervalDays, totalCycles: 0, nextRecurrenceAt: null };
  }

  const scheduleUnchanged =
    existing?.nextRecurrenceAt != null &&
    existing.frequency === frequency &&
    existing.intervalDays === intervalDays;

  return {
    frequency,
    intervalDays,
    totalCycles,
    nextRecurrenceAt: scheduleUnchanged ? existing!.nextRecurrenceAt : addInterval(now, frequency, intervalDays),
  };
}
