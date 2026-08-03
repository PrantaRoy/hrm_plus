import { ReactNode, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DashboardCalendarDayDto } from "@hrm-plus/shared";
import { Button, Card, Spinner } from "@hrm-plus/ui";
import { getDashboardCalendar } from "../../api/dashboard";
import { sequentialStep } from "./charts/chartTheme";

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function TenantDutyCalendar() {
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(new Date()));
  const [days, setDays] = useState<DashboardCalendarDayDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const start = startOfMonth(monthAnchor);
    const end = endOfMonth(monthAnchor);
    getDashboardCalendar({ startDate: toDateInput(start), endDate: toDateInput(end) })
      .then(setDays)
      .catch(() => setDays([]))
      .finally(() => setLoading(false));
  }, [monthAnchor]);

  const daysByDate = useMemo(() => {
    const map = new Map<string, DashboardCalendarDayDto>();
    for (const day of days) map.set(day.date, day);
    return map;
  }, [days]);

  const maxDutyCount = useMemo(() => Math.max(1, ...days.map((d) => d.dutyAssignedCount)), [days]);

  const cells = useMemo(() => {
    const first = startOfMonth(monthAnchor);
    const last = endOfMonth(monthAnchor);
    const leadingBlanks = first.getUTCDay();
    const cellDays: (string | null)[] = Array.from({ length: leadingBlanks }, () => null);
    for (let d = 1; d <= last.getUTCDate(); d += 1) {
      cellDays.push(toDateInput(new Date(Date.UTC(monthAnchor.getUTCFullYear(), monthAnchor.getUTCMonth(), d))));
    }
    return cellDays;
  }, [monthAnchor]);

  const monthLabel = monthAnchor.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card
      title={monthLabel}
      description="Holidays and weekly-off days are highlighted; other days show duty assigned."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMonthAnchor((m) => new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() - 1, 1)))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMonthAnchor((m) => new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1)))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1.5">
            {weekdayLabels.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-slate-500">
                {d}
              </div>
            ))}
            {cells.map((date, idx) => {
              if (!date) return <div key={`blank-${idx}`} />;
              const day = daysByDate.get(date);
              const dayNumber = Number(date.slice(-2));

              let content: ReactNode = null;
              let className = "rounded-md border border-slate-100 p-1.5 min-h-[64px]";
              let title = date;
              let backgroundColor: string | undefined;

              if (day?.isWeekend) {
                className += " bg-slate-100";
                content = <div className="mt-1 text-[10px] font-medium leading-tight text-slate-500">Weekly Off</div>;
                title = `${date}: Weekly off`;
              } else if (day?.isHoliday) {
                className += " bg-amber-50";
                content = (
                  <div className="mt-1 truncate text-[10px] font-medium leading-tight text-amber-700" title={day.holidayName ?? "Holiday"}>
                    {day.holidayName ?? "Holiday"}
                  </div>
                );
                title = `${date}: Holiday${day.holidayName ? ` — ${day.holidayName}` : ""}`;
              } else if (day) {
                backgroundColor = sequentialStep(day.dutyAssignedCount, maxDutyCount);
                className += " border-transparent";
                content = (
                  <div className="mt-1 text-[11px] font-semibold leading-tight text-slate-900">
                    {day.dutyAssignedCount}
                  </div>
                );
                title = `${date}: ${day.dutyAssignedCount} duty assigned`;
              }

              return (
                <div key={date} className={className} style={{ backgroundColor }} title={title}>
                  <div className="text-xs text-slate-400">{dayNumber}</div>
                  {content}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-slate-100" /> Weekly off
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-amber-50" /> Holiday
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded"
                style={{ background: "linear-gradient(to right, #cde2fb, #0d366b)" }}
              />
              Duty count (light → dark)
            </span>
          </div>
        </>
      )}
    </Card>
  );
}
