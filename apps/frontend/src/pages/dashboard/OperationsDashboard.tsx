import { useEffect, useState } from "react";
import { Button, Card, PageHeader } from "@hrm-plus/ui";
import { DashboardSummaryDto, DashboardTrendsDto } from "@hrm-plus/shared";
import { getDashboardSummary, getDashboardTrends } from "../../api/dashboard";
import { useAuth } from "../../auth/AuthContext";
import { TenantDutyCalendar } from "../../components/dashboard/TenantDutyCalendar";
import { TodayOverviewCard } from "../../components/dashboard/TodayOverviewCard";
import { DutyScheduleReport } from "../../components/dashboard/DutyScheduleReport";
import { ShiftAttendanceLog } from "../../components/dashboard/ShiftAttendanceLog";
import { PendingLeaveApprovalsCard } from "../../components/dashboard/PendingLeaveApprovalsCard";
import { AttendanceTrendChart } from "../../components/dashboard/charts/AttendanceTrendChart";
import { LeaveStatusBreakdownChart } from "../../components/dashboard/charts/LeaveStatusBreakdownChart";

export default function OperationsDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummaryDto | null>(null);
  const [trends, setTrends] = useState<DashboardTrendsDto | null>(null);
  const [days, setDays] = useState<7 | 30>(7);

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  useEffect(() => {
    getDashboardTrends({ days })
      .then(setTrends)
      .catch(() => setTrends(null));
  }, [days]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? ""}`}
        description="Here's what's happening across your organisation today."
      />

      <TodayOverviewCard summary={summary} trends={trends} />

      <Card
        title="Attendance Trend"
        description="Present, absent, and late counts over time."
        actions={
          <div className="flex items-center gap-1.5">
            <Button variant={days === 7 ? "primary" : "secondary"} size="sm" onClick={() => setDays(7)}>
              7 days
            </Button>
            <Button variant={days === 30 ? "primary" : "secondary"} size="sm" onClick={() => setDays(30)}>
              30 days
            </Button>
          </div>
        }
      >
        {trends ? <AttendanceTrendChart points={trends.points} /> : <p className="text-sm text-slate-400">Loading…</p>}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Leave Requests by Status" description={`Requests created in the last ${days} days.`}>
          {trends ? (
            <LeaveStatusBreakdownChart breakdown={trends.leaveStatusBreakdown} />
          ) : (
            <p className="text-sm text-slate-400">Loading…</p>
          )}
        </Card>

        <PendingLeaveApprovalsCard
          count={summary?.pendingLeaveApprovalsCount ?? 0}
          preview={summary?.pendingLeaveApprovalsPreview ?? []}
        />
      </div>

      <DutyScheduleReport />

      <ShiftAttendanceLog />

      <TenantDutyCalendar />
    </div>
  );
}
