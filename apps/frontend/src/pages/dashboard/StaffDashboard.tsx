import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarOff } from "lucide-react";
import { EmployeeLeaveAllocationDto, LeaveRequestDto } from "@hrm-plus/shared";
import { Card, EmptyState, PageHeader, StatusPill } from "@hrm-plus/ui";
import { listMyAllocations, listMyLeaveRequests } from "../../api/leaveRequests";
import { useAuth } from "../../auth/AuthContext";
import { AttendanceWidget } from "../../components/attendance/AttendanceWidget";
import { DutyScheduleMonthCalendar } from "../../components/DutyScheduleMonthCalendar";
import { LiveClock } from "../../components/LiveClock";

export default function StaffDashboard() {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState<EmployeeLeaveAllocationDto[]>([]);
  const [pendingRequests, setPendingRequests] = useState<LeaveRequestDto[]>([]);

  useEffect(() => {
    listMyAllocations()
      .then(setAllocations)
      .catch(() => setAllocations([]));
    listMyLeaveRequests("Pending")
      .then(setPendingRequests)
      .catch(() => setPendingRequests([]));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? ""}`}
        description="Here's your attendance, schedule, and leave at a glance."
      />

      <LiveClock />

      <AttendanceWidget />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="My Leave Balance" actions={<Link to="/leave/apply" className="text-sm text-brand-600 hover:underline">Apply for leave →</Link>}>
          {allocations.length === 0 ? (
            <p className="text-sm text-slate-400">No leave allocations configured yet.</p>
          ) : (
            <div className="space-y-3">
              {allocations.map((allocation) => {
                const usedPct = allocation.allocatedDays > 0 ? (allocation.daysUsed / allocation.allocatedDays) * 100 : 0;
                return (
                  <div key={allocation.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-900">{allocation.leaveTypeName}</span>
                      <span className="text-slate-500">
                        {allocation.remainingDays} of {allocation.allocatedDays} days remaining
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-brand-500"
                        style={{ width: `${Math.min(100, usedPct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card
          title="My Pending Leave Requests"
          actions={
            <Link to="/leave/my-requests" className="text-sm text-brand-600 hover:underline">
              View all →
            </Link>
          }
        >
          {pendingRequests.length === 0 ? (
            <EmptyState icon={CalendarOff} title="No pending leave requests" />
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{request.leaveTypeName}</p>
                    <p className="truncate text-xs text-slate-500">
                      {request.startDate.slice(0, 10)} → {request.endDate.slice(0, 10)} · {request.daysRequested} day
                      {request.daysRequested === 1 ? "" : "s"}
                    </p>
                  </div>
                  <StatusPill status={request.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <DutyScheduleMonthCalendar />
    </div>
  );
}
