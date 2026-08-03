import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DutyScheduleAssignmentDto, HolidayDto } from "@hrm-plus/shared";
import { Button, Card, Spinner } from "@hrm-plus/ui";
import { getEmployeeSchedule, getMySchedule } from "../api/rosters";
import { getHolidayCalendar } from "../api/holidays";

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function assignmentLabel(assignment: DutyScheduleAssignmentDto, holidayName?: string): string {
  if (assignment.isWeekend) return "Weekly Off";
  if (assignment.isLeave) return "Leave";
  if (assignment.isHoliday) return holidayName ? `Holiday: ${holidayName}` : "Holiday";
  return assignment.dutyScheduleName ?? "—";
}

export interface DutyScheduleMonthCalendarProps {
  /** Omit to show the signed-in user's own schedule. */
  employeeId?: number;
  compact?: boolean;
}

export function DutyScheduleMonthCalendar({ employeeId, compact }: DutyScheduleMonthCalendarProps) {
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(new Date()));
  const [assignments, setAssignments] = useState<DutyScheduleAssignmentDto[]>([]);
  const [holidays, setHolidays] = useState<HolidayDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const start = startOfMonth(monthAnchor);
    const end = endOfMonth(monthAnchor);
    const params = { startDate: toDateInput(start), endDate: toDateInput(end) };
    const request = employeeId ? getEmployeeSchedule(employeeId, params) : getMySchedule(params);
    Promise.all([
      request.catch(() => []),
      getHolidayCalendar(params).catch(() => []),
    ])
      .then(([assignmentList, holidayList]) => {
        setAssignments(assignmentList);
        setHolidays(holidayList);
      })
      .finally(() => setLoading(false));
  }, [monthAnchor, employeeId]);

  const assignmentsByDate = useMemo(() => {
    const map = new Map<string, DutyScheduleAssignmentDto>();
    for (const assignment of assignments) {
      map.set(toDateKey(assignment.date), assignment);
    }
    return map;
  }, [assignments]);

  const holidaysByDate = useMemo(() => {
    const map = new Map<string, HolidayDto>();
    for (const holiday of holidays) {
      map.set(toDateKey(holiday.date), holiday);
    }
    return map;
  }, [holidays]);

  const cells = useMemo(() => {
    const first = startOfMonth(monthAnchor);
    const last = endOfMonth(monthAnchor);
    const leadingBlanks = first.getUTCDay();
    const days: (string | null)[] = Array.from({ length: leadingBlanks }, () => null);
    for (let d = 1; d <= last.getUTCDate(); d += 1) {
      days.push(toDateInput(new Date(Date.UTC(monthAnchor.getUTCFullYear(), monthAnchor.getUTCMonth(), d))));
    }
    return days;
  }, [monthAnchor]);

  const monthLabel = monthAnchor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const weekdayLabels = compact
    ? ["S", "M", "T", "W", "T", "F", "S"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card
      title={monthLabel}
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
        <div className="grid grid-cols-7 gap-1.5">
          {weekdayLabels.map((d, idx) => (
            <div key={`${d}-${idx}`} className="text-center text-xs font-semibold text-slate-500">
              {d}
            </div>
          ))}
          {cells.map((date, idx) => {
            if (!date) return <div key={`blank-${idx}`} />;
            const assignment = assignmentsByDate.get(date);
            const holiday = holidaysByDate.get(date);
            const label = assignment
              ? assignmentLabel(assignment, holiday?.name)
              : holiday
                ? `Holiday: ${holiday.name}`
                : null;
            return (
              <div
                key={date}
                className={`rounded-md border border-slate-100 p-1 ${compact ? "min-h-[58px]" : "min-h-[70px] p-1.5"}`}
              >
                <div className="text-xs text-slate-400">{Number(date.slice(-2))}</div>
                {label && (
                  <div
                    className={`mt-1 rounded bg-brand-50 px-1 py-0.5 font-medium leading-tight text-brand-700 ${
                      compact ? "text-[8px] break-words" : "text-[11px] py-0.5"
                    }`}
                    title={label}
                  >
                    {label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
