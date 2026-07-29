import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DutyScheduleAssignmentDto } from "@hrm-plus/shared";
import { Button, Card, PageHeader, Spinner } from "@hrm-plus/ui";
import { getMySchedule } from "../api/rosters";

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

export default function MySchedule() {
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(new Date()));
  const [assignments, setAssignments] = useState<DutyScheduleAssignmentDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const start = startOfMonth(monthAnchor);
    const end = endOfMonth(monthAnchor);
    getMySchedule({ startDate: toDateInput(start), endDate: toDateInput(end) })
      .then(setAssignments)
      .finally(() => setLoading(false));
  }, [monthAnchor]);

  const assignmentsByDate = useMemo(() => {
    const map = new Map<string, DutyScheduleAssignmentDto>();
    for (const assignment of assignments) {
      map.set(toDateKey(assignment.date), assignment);
    }
    return map;
  }, [assignments]);

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

  return (
    <div className="space-y-5">
      <PageHeader title="My Duty Schedule" description="Your approved duty assignments." />

      <Card
        title={monthLabel}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setMonthAnchor((m) => new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() - 1, 1)))
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setMonthAnchor((m) => new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1)))
              }
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
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-slate-500">
                {d}
              </div>
            ))}
            {cells.map((date, idx) => {
              if (!date) return <div key={`blank-${idx}`} />;
              const assignment = assignmentsByDate.get(date);
              const label = assignment
                ? assignment.isWeekend
                  ? "Weekly Off"
                  : assignment.isLeave
                    ? "Leave"
                    : assignment.isHoliday
                      ? "Holiday"
                      : (assignment.dutyScheduleName ?? "—")
                : null;
              return (
                <div key={date} className="min-h-[70px] rounded-md border border-slate-100 p-1.5">
                  <div className="text-xs text-slate-400">{Number(date.slice(-2))}</div>
                  {label && (
                    <div className="mt-1 rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-medium text-brand-700">
                      {label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
