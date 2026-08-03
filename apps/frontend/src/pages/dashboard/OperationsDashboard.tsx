import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, Clock, UserCheck, UserX } from "lucide-react";
import { Button, Card, PageHeader, StatCard } from "@hrm-plus/ui";
import { DashboardSummaryDto, DashboardTrendsDto } from "@hrm-plus/shared";
import { getDashboardSummary, getDashboardTrends } from "../../api/dashboard";
import { useAuth } from "../../auth/AuthContext";
import { TenantDutyCalendar } from "../../components/dashboard/TenantDutyCalendar";
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
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? ""}`}
        description="Here's what's happening across your organisation today."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Duty Assigned" value={summary?.dutyAssignedToday ?? "—"} icon={ClipboardList} />
        <StatCard label="Completed" value={summary?.completedToday ?? "—"} icon={CheckCircle2} />
        <StatCard label="Incomplete" value={summary?.incompleteToday ?? "—"} icon={AlertTriangle} />
        <StatCard label="Present" value={summary?.presentToday ?? "—"} icon={UserCheck} />
        <StatCard label="Absent" value={summary?.absentToday ?? "—"} icon={UserX} />
        <StatCard label="Late" value={summary?.lateToday ?? "—"} icon={Clock} />
      </div>

      <PendingLeaveApprovalsCard
        count={summary?.pendingLeaveApprovalsCount ?? 0}
        preview={summary?.pendingLeaveApprovalsPreview ?? []}
      />

      <TenantDutyCalendar />

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

      <Card title="Leave Requests by Status" description={`Requests created in the last ${days} days.`}>
        {trends ? (
          <LeaveStatusBreakdownChart breakdown={trends.leaveStatusBreakdown} />
        ) : (
          <p className="text-sm text-slate-400">Loading…</p>
        )}
      </Card>
    </div>
  );
}
