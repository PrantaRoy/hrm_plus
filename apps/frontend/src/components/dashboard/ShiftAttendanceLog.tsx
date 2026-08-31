import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { ShiftAttendanceLogDto, ShiftAttendanceLogEntryDto } from "@hrm-plus/shared";
import { Card, EmptyState, Spinner } from "@hrm-plus/ui";
import { getShiftAttendanceLog } from "../../api/attendance";

type Mode = "today" | "week";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function mondayOf(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() - ((next.getDay() + 6) % 7));
  return next;
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function fmtDateHeading(dateKey: string): string {
  return new Date(`${dateKey.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

function fmtMinutes(total: number): string {
  if (total < 60) return `${total}m`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function isOnLeave(entry: ShiftAttendanceLogEntryDto): boolean {
  return entry.isLeave || entry.status === "OnLeave";
}

/* --------------------------------------------------------------------- rows */

function EntryRow({ entry }: { entry: ShiftAttendanceLogEntryDto }) {
  const name = entry.employeeName ?? entry.employeeCode ?? `#${entry.employeeId}`;

  return (
    <div className="flex items-start justify-between gap-3 border-t border-slate-50 py-1.5 first:border-0">
      <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700" title={name}>
        {name}
      </span>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
        {isOnLeave(entry) ? (
          <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[11px] font-medium text-violet-700">On Leave</span>
        ) : entry.checkInAt ? (
          <>
            <span className="tabular-nums text-xs text-slate-600">
              {fmtTime(entry.checkInAt)} – {fmtTime(entry.checkOutAt)}
            </span>
            {entry.lateMinutes > 0 && (
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
                Late {fmtMinutes(entry.lateMinutes)}
              </span>
            )}
            {entry.overtimeMinutes > 0 && (
              <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[11px] font-medium text-sky-700">
                Over {fmtMinutes(entry.overtimeMinutes)}
              </span>
            )}
            {entry.earlyLeaveMinutes > 0 && (
              <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[11px] font-medium text-orange-700">
                Early {fmtMinutes(entry.earlyLeaveMinutes)}
              </span>
            )}
            {entry.totalBreakMinutes > 0 && (
              <span className="text-[11px] text-slate-400">Break {fmtMinutes(entry.totalBreakMinutes)}</span>
            )}
            {entry.isManualEntry && <span className="text-[11px] italic text-slate-400">manual</span>}
          </>
        ) : (
          <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[11px] font-medium text-rose-700">
            {entry.status === "Cancelled" ? "Cancelled" : "No check-in"}
          </span>
        )}
      </div>
    </div>
  );
}

function ShiftGroup({ group, mode }: { group: ShiftAttendanceLogDto["shifts"][number]; mode: Mode }) {
  const timeLabel =
    group.startTime && group.endTime ? `${group.startTime}–${group.endTime}` : null;

  const checkedIn = group.entries.filter((e) => e.checkInAt).length;
  const late = group.entries.filter((e) => e.lateMinutes > 0).length;
  const onLeave = group.entries.filter(isOnLeave).length;

  const byDate = useMemo(() => {
    const map = new Map<string, ShiftAttendanceLogEntryDto[]>();
    for (const entry of group.entries) {
      const key = entry.date.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [group.entries]);

  return (
    <div className="rounded-lg border border-slate-200">
      <div className="flex items-center justify-between gap-2 rounded-t-lg border-b border-slate-100 bg-slate-50 px-3 py-2">
        <p className="text-xs font-semibold text-slate-900">
          {group.dutyScheduleName}
          {timeLabel && <span className="ml-1.5 font-normal text-slate-400">{timeLabel}</span>}
        </p>
        <p className="shrink-0 text-[11px] text-slate-500">
          {checkedIn} in · {late} late · {onLeave} leave
        </p>
      </div>
      <div className="px-3 py-1">
        {mode === "today"
          ? group.entries.map((entry, i) => <EntryRow key={`${entry.employeeId}-${i}`} entry={entry} />)
          : byDate.map(([dateKey, entries]) => (
              <div key={dateKey} className="border-b border-slate-100 py-1 last:border-0">
                <p className="py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {fmtDateHeading(dateKey)}
                </p>
                {entries.map((entry, i) => (
                  <EntryRow key={`${entry.employeeId}-${i}`} entry={entry} />
                ))}
              </div>
            ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- shell */

export function ShiftAttendanceLog() {
  const [mode, setMode] = useState<Mode>("today");
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<ShiftAttendanceLogDto | null>(null);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => {
    if (mode === "today") {
      const day = addDays(new Date(), offset);
      const key = toKey(day);
      return {
        startDate: key,
        endDate: key,
        heading: offset === 0 ? "Today" : fmtDateHeading(key),
        sub: day.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short", year: "numeric" }),
      };
    }
    const start = addDays(mondayOf(new Date()), offset * 7);
    const end = addDays(start, 6);
    const startLabel = start.toLocaleDateString(undefined, { day: "numeric", month: "short" });
    const endLabel = end.toLocaleDateString(undefined, { day: "numeric", month: "short" });
    return {
      startDate: toKey(start),
      endDate: toKey(end),
      heading: offset === 0 ? "This Week" : `${startLabel} – ${endLabel}`,
      sub: `${startLabel} – ${endLabel}`,
    };
  }, [mode, offset]);

  useEffect(() => {
    setLoading(true);
    getShiftAttendanceLog({ startDate: range.startDate, endDate: range.endDate })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [range.startDate, range.endDate]);

  function switchMode(next: Mode) {
    setMode(next);
    setOffset(0);
  }

  const shifts = data?.shifts ?? [];

  return (
    <Card
      title="Attendance Log by Shift"
      description="Check-in / check-out, lateness, overtime and leave grouped by shift."
      actions={
        <div className="flex rounded-md border border-slate-200 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => switchMode("today")}
            className={`rounded px-2.5 py-1 transition-colors ${
              mode === "today" ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => switchMode("week")}
            className={`rounded px-2.5 py-1 transition-colors ${
              mode === "week" ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            This Week
          </button>
        </div>
      }
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{range.heading}</p>
          <p className="text-xs text-slate-500">{range.sub}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setOffset((o) => o - 1)}
            className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
            aria-label={mode === "today" ? "Previous day" : "Previous week"}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setOffset(0)}
            disabled={offset === 0}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            {mode === "today" ? "Today" : "This week"}
          </button>
          <button
            type="button"
            onClick={() => setOffset((o) => o + 1)}
            className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
            aria-label={mode === "today" ? "Next day" : "Next week"}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : shifts.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No attendance records for this period" />
      ) : (
        <div className="space-y-3">
          {shifts.map((group) => (
            <ShiftGroup key={group.dutyScheduleId ?? "no-shift"} group={group} mode={mode} />
          ))}
        </div>
      )}
    </Card>
  );
}
