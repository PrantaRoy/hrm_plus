import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, UserCheck, Users } from "lucide-react";
import { Card, PageHeader, Spinner, StatCard } from "@hrm-plus/ui";
import { DepartmentDto, DutyScheduleAssignmentDto, EmployeeDto, HolidayDto } from "@hrm-plus/shared";
import { listEmployees } from "../api/employees";
import { listDepartments } from "../api/departments";
import { getMySchedule } from "../api/rosters";
import { getHolidayCalendar } from "../api/holidays";
import { useAuth } from "../auth/AuthContext";
import { AttendanceWidget } from "../components/attendance/AttendanceWidget";

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

export default function Dashboard() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<EmployeeDto[] | null>(null);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [mySchedule, setMySchedule] = useState<DutyScheduleAssignmentDto[]>([]);
  const [holidays, setHolidays] = useState<HolidayDto[]>([]);

  const next7Days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      return toDateInput(d);
    });
  }, []);

  useEffect(() => {
    listEmployees({ page: 1, pageSize: 100 }).then((res) => setEmployees(res.items));
    listDepartments().then(setDepartments).catch(() => setDepartments([]));

    const params = { startDate: next7Days[0], endDate: next7Days[next7Days.length - 1] };
    getMySchedule(params)
      .then(setMySchedule)
      .catch(() => setMySchedule([]));
    getHolidayCalendar(params)
      .then(setHolidays)
      .catch(() => setHolidays([]));
  }, [next7Days]);

  const scheduleByDate = useMemo(() => {
    const map = new Map<string, DutyScheduleAssignmentDto>();
    for (const assignment of mySchedule) {
      map.set(toDateKey(assignment.date), assignment);
    }
    return map;
  }, [mySchedule]);

  const holidaysByDate = useMemo(() => {
    const map = new Map<string, HolidayDto>();
    for (const holiday of holidays) {
      map.set(toDateKey(holiday.date), holiday);
    }
    return map;
  }, [holidays]);

  const upcomingDays = next7Days
    .map((date) => ({ date, assignment: scheduleByDate.get(date), holiday: holidaysByDate.get(date) }))
    .filter((day) => day.assignment || day.holiday);

  if (!employees) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const activeCount = employees.filter((e) => e.status === "Active").length;

  const byDepartment = departments.map((dept) => ({
    name: dept.name,
    count: employees.filter((e) => e.departmentId === dept.id).length,
  }));
  const unassigned = employees.filter((e) => e.departmentId === null).length;
  if (unassigned > 0) byDepartment.push({ name: "Unassigned", count: unassigned });
  const maxCount = Math.max(1, ...byDepartment.map((d) => d.count));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? ""}`}
        description="Here's what's happening across your organisation."
      />

      <AttendanceWidget />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total employees" value={employees.length} icon={Users} />
        <StatCard label="Active employees" value={activeCount} icon={UserCheck} />
        <StatCard label="Departments" value={departments.length} icon={Building2} />
      </div>

      <Card title="Employees by department">
        {byDepartment.length === 0 ? (
          <p className="text-sm text-slate-400">No department data yet.</p>
        ) : (
          <div className="space-y-3">
            {byDepartment.map((dept) => (
              <div key={dept.name} className="flex items-center gap-3">
                <span className="w-36 shrink-0 truncate text-sm text-slate-600">{dept.name}</span>
                <div className="h-2 flex-1 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-brand-500"
                    style={{ width: `${(dept.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-sm font-medium text-slate-900">{dept.count}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card
        title="My Duty Schedule"
        description="Your approved duty for the next 7 days."
        actions={
          <Link to="/my-schedule" className="text-sm text-brand-600 hover:underline">
            View full calendar
          </Link>
        }
      >
        {upcomingDays.length === 0 ? (
          <p className="text-sm text-slate-400">No approved duty schedule for the coming week yet.</p>
        ) : (
          <div className="space-y-2">
            {upcomingDays.map(({ date, assignment, holiday }) => (
              <div key={date} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {new Date(date).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </span>
                <span className="font-medium text-slate-900">
                  {assignment
                    ? assignment.isWeekend
                      ? "Weekly Off"
                      : assignment.isLeave || assignment.status === "OnLeave"
                        ? "Leave"
                        : assignment.isHoliday
                          ? holiday
                            ? `Holiday: ${holiday.name}`
                            : "Holiday"
                          : (assignment.dutyScheduleName ?? "—")
                    : `Holiday: ${holiday!.name}`}
                  {assignment?.status === "CheckedIn" && " · Checked In"}
                  {assignment?.status === "Completed" && " · Completed"}
                  {assignment?.status === "Incomplete" && " · Incomplete"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
