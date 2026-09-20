import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { DutyScheduleAssignmentDto } from "@hrm-plus/shared";
import { Card, EmptyState, Spinner } from "@hrm-plus/ui";
import { getScheduleReport } from "../../api/rosters";

type ReportTab = "today" | "week";

const TIMELINE_START_HOUR = 1;
const TIMELINE_END_HOUR = 24;
const TIMELINE_MINUTES = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60;

/** Stable per-employee colour, keyed off the employee id. */
const EMPLOYEE_COLOURS = [
  { solid: "#0ca30c", tint: "#e7f4e7" },
  { solid: "#e2900c", tint: "#fbefd8" },
  { solid: "#2a78d6", tint: "#e1ecfa" },
  { solid: "#d03b3b", tint: "#f8e3e3" },
  { solid: "#7c3aed", tint: "#ece3fd" },
  { solid: "#0891b2", tint: "#daeff3" },
  { solid: "#db2777", tint: "#fbe1ee" },
  { solid: "#5b7c0a", tint: "#eaf2d7" },
  { solid: "#c2410c", tint: "#fbe6da" },
  { solid: "#475569", tint: "#e6e9ee" },
] as const;

function colourFor(employeeId: number) {
  return EMPLOYEE_COLOURS[Math.abs(employeeId) % EMPLOYEE_COLOURS.length];
}

const HOUR_TICKS: number[] = (() => {
  const ticks: number[] = [];
  for (let h = TIMELINE_START_HOUR; h <= TIMELINE_END_HOUR; h += 3) ticks.push(h);
  return ticks;
})();

const TICK_SPAN = TIMELINE_END_HOUR - TIMELINE_START_HOUR;

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
  const dow = (next.getDay() + 6) % 7; // 0 = Monday
  next.setDate(next.getDate() - dow);
  return next;
}

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Returns [startMinutes, endMinutes], rolling the end past midnight when a shift wraps. */
function shiftRange(start: string, end: string): [number, number] {
  const s = minutesOf(start);
  let e = minutesOf(end);
  if (e <= s) e += 24 * 60;
  return [s, e];
}

function shiftHours(start: string, end: string): number {
  const [s, e] = shiftRange(start, end);
  return (e - s) / 60;
}

function isWorkingShift(a: DutyScheduleAssignmentDto): boolean {
  return (
    !!a.dutyScheduleStartTime &&
    !!a.dutyScheduleEndTime &&
    !a.isLeave &&
    !a.isHoliday &&
    !a.isWeekend &&
    a.status !== "Cancelled"
  );
}

function nonWorkingLabel(a: DutyScheduleAssignmentDto): string {
  if (a.isWeekend) return "Weekly Off";
  if (a.isLeave || a.status === "OnLeave") return "Leave";
  if (a.isHoliday) return "Holiday";
  if (a.status === "Cancelled") return "Cancelled";
  return "No shift";
}

interface EmployeeRow {
  employeeId: number;
  name: string;
}

function collectEmployees(assignments: DutyScheduleAssignmentDto[]): EmployeeRow[] {
  const map = new Map<number, EmployeeRow>();
  for (const a of assignments) {
    if (!map.has(a.employeeId)) {
      map.set(a.employeeId, { employeeId: a.employeeId, name: a.employeeName ?? a.employeeCode ?? `#${a.employeeId}` });
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/* ------------------------------------------------------------------ Today tab */

function dayLabel(offset: number): string {
  if (offset === 0) return "Today";
  if (offset === 1) return "Tomorrow";
  if (offset === -1) return "Yesterday";
  return "";
}

function TodayTimeline() {
  const [offset, setOffset] = useState(0);
  const [assignments, setAssignments] = useState<DutyScheduleAssignmentDto[]>([]);
  const [loading, setLoading] = useState(true);

  const date = useMemo(() => addDays(new Date(), offset), [offset]);
  const dateKey = toKey(date);

  useEffect(() => {
    setLoading(true);
    getScheduleReport({ startDate: dateKey, endDate: dateKey })
      .then(setAssignments)
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, [dateKey]);

  const employees = useMemo(() => collectEmployees(assignments), [assignments]);
  const byEmployee = useMemo(() => {
    const map = new Map<number, DutyScheduleAssignmentDto[]>();
    for (const a of assignments) {
      const list = map.get(a.employeeId) ?? [];
      list.push(a);
      map.set(a.employeeId, list);
    }
    return map;
  }, [assignments]);

  const longLabel = date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const shortLabel = date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{dayLabel(offset) || shortLabel}</p>
          <p className="text-xs text-slate-500">{longLabel}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setOffset((o) => o - 1)}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setOffset(0)}
            disabled={offset === 0}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setOffset((o) => o + 1)}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : employees.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No duty assigned for this day" />
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            {/* hour axis */}
            <div className="flex">
              <div className="w-36 shrink-0" />
              <div className="relative h-5 flex-1">
                {HOUR_TICKS.map((h) => (
                  <span
                    key={h}
                    className={`absolute text-[10px] text-slate-400 ${
                      h === TIMELINE_END_HOUR
                        ? "-translate-x-full"
                        : h === TIMELINE_START_HOUR
                          ? ""
                          : "-translate-x-1/2"
                    }`}
                    style={{ left: `${((h - TIMELINE_START_HOUR) / TICK_SPAN) * 100}%` }}
                  >
                    {pad(h)}:00
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              {employees.map((emp) => {
                const colour = colourFor(emp.employeeId);
                const rows = byEmployee.get(emp.employeeId) ?? [];
                const working = rows.filter(isWorkingShift);
                const idle = rows.find((r) => !isWorkingShift(r));
                return (
                  <div key={emp.employeeId} className="flex items-center">
                    <div className="flex w-36 shrink-0 items-center gap-1.5 pr-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colour.solid }} />
                      <span className="truncate text-xs font-medium text-slate-700" title={emp.name}>
                        {emp.name}
                      </span>
                    </div>
                    <div className="relative h-9 flex-1 rounded-md bg-slate-50">
                      {HOUR_TICKS.map((h) => (
                        <span
                          key={h}
                          className="absolute inset-y-0 w-px bg-slate-200/70"
                          style={{ left: `${((h - TIMELINE_START_HOUR) / TICK_SPAN) * 100}%` }}
                        />
                      ))}

                      {working.length === 0 && idle && (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium uppercase tracking-wide text-slate-400">
                          {nonWorkingLabel(idle)}
                        </div>
                      )}

                      {working.map((a) => {
                        const [startMin, endMinRaw] = shiftRange(a.dutyScheduleStartTime!, a.dutyScheduleEndTime!);
                        const lo = Math.max(startMin, TIMELINE_START_HOUR * 60);
                        const hi = Math.min(endMinRaw, TIMELINE_END_HOUR * 60);
                        if (hi <= lo) return null;
                        const left = ((lo - TIMELINE_START_HOUR * 60) / TIMELINE_MINUTES) * 100;
                        const width = ((hi - lo) / TIMELINE_MINUTES) * 100;
                        return (
                          <div
                            key={a.id}
                            className="absolute inset-y-1 overflow-hidden rounded px-1.5 py-0.5"
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                              backgroundColor: colour.tint,
                              borderLeft: `3px solid ${colour.solid}`,
                            }}
                            title={`${a.employeeName ?? ""} · ${a.dutyScheduleName ?? "Shift"} · ${a.dutyScheduleStartTime}–${a.dutyScheduleEndTime}`}
                          >
                            <p className="truncate text-[10px] font-semibold leading-tight" style={{ color: colour.solid }}>
                              {a.dutyScheduleStartTime}–{a.dutyScheduleEndTime}
                            </p>
                            <p className="truncate text-[9px] leading-tight text-slate-500">{a.dutyScheduleName}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- Week tab */

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function WeekGrid() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [assignments, setAssignments] = useState<DutyScheduleAssignmentDto[]>([]);
  const [loading, setLoading] = useState(true);

  const weekStart = useMemo(() => addDays(mondayOf(new Date()), weekOffset * 7), [weekOffset]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const startKey = toKey(days[0]);
  const endKey = toKey(days[6]);

  useEffect(() => {
    setLoading(true);
    getScheduleReport({ startDate: startKey, endDate: endKey })
      .then(setAssignments)
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, [startKey, endKey]);

  const employees = useMemo(() => collectEmployees(assignments), [assignments]);
  const byCell = useMemo(() => {
    const map = new Map<string, DutyScheduleAssignmentDto>();
    for (const a of assignments) map.set(`${a.employeeId}|${a.date.slice(0, 10)}`, a);
    return map;
  }, [assignments]);

  const todayKey = toKey(new Date());

  const rangeLabel = `${days[0].toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{weekOffset === 0 ? "This Week" : rangeLabel}</p>
          <p className="text-xs text-slate-500">{weekOffset === 0 ? rangeLabel : ""}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w - 1)}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            disabled={weekOffset === 0}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            This week
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w + 1)}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : employees.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No duty scheduled this week" />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[720px] border-separate border-spacing-0 text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white px-2 py-2 text-left font-semibold text-slate-500">
                  Employee
                </th>
                {days.map((d, i) => {
                  const key = toKey(d);
                  return (
                    <th
                      key={key}
                      className={`px-2 py-2 text-left font-semibold ${key === todayKey ? "text-brand-600" : "text-slate-500"}`}
                    >
                      {WEEKDAY_LABELS[i]} {d.getDate()}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const colour = colourFor(emp.employeeId);
                let weekMinutes = 0;
                for (const d of days) {
                  const a = byCell.get(`${emp.employeeId}|${toKey(d)}`);
                  if (a && isWorkingShift(a)) weekMinutes += shiftHours(a.dutyScheduleStartTime!, a.dutyScheduleEndTime!) * 60;
                }
                return (
                  <tr key={emp.employeeId}>
                    <td className="sticky left-0 z-10 border-t border-slate-100 bg-white px-2 py-1.5 align-top">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colour.solid }} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-700" title={emp.name}>
                            {emp.name}
                          </p>
                          <p className="text-[10px] text-slate-400">{Math.round(weekMinutes / 60)}h</p>
                        </div>
                      </div>
                    </td>
                    {days.map((d) => {
                      const key = toKey(d);
                      const a = byCell.get(`${emp.employeeId}|${key}`);
                      return (
                        <td key={key} className="border-t border-slate-100 px-1 py-1.5 align-top">
                          {!a ? (
                            <span className="text-slate-300">·</span>
                          ) : isWorkingShift(a) ? (
                            <div
                              className="rounded px-1.5 py-1"
                              style={{ backgroundColor: colour.tint, borderLeft: `3px solid ${colour.solid}` }}
                              title={`${a.dutyScheduleName ?? "Shift"} · ${a.dutyScheduleStartTime}–${a.dutyScheduleEndTime}`}
                            >
                              <p className="font-semibold leading-tight" style={{ color: colour.solid }}>
                                {a.dutyScheduleStartTime}–{a.dutyScheduleEndTime}
                              </p>
                              <p className="truncate text-[10px] leading-tight text-slate-500">{a.dutyScheduleName}</p>
                            </div>
                          ) : (
                            <div className="rounded bg-slate-100 px-1.5 py-1 text-[10px] font-medium text-slate-500">
                              {nonWorkingLabel(a)}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- shell */

export function DutyScheduleReport() {
  const [tab, setTab] = useState<ReportTab>("today");

  return (
    <Card
      title="Duty Schedule Report"
      description="Company-wide shift coverage for today and the current week."
      actions={
        <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setTab("today")}
            className={`rounded px-2.5 py-1 transition-colors ${
              tab === "today" ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setTab("week")}
            className={`rounded px-2.5 py-1 transition-colors ${
              tab === "week" ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            This Week
          </button>
        </div>
      }
    >
      {tab === "today" ? <TodayTimeline /> : <WeekGrid />}
    </Card>
  );
}
