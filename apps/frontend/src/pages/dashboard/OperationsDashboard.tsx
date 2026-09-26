import { useEffect, useState } from "react";
import { Card, PageHeader } from "@hrm-plus/ui";
import { DashboardSummaryDto, DashboardTrendsDto } from "@hrm-plus/shared";
import { getDashboardSummary, getDashboardTrends } from "../../api/dashboard";
import { useAuth } from "../../auth/AuthContext";
import { TenantDutyCalendar } from "../../components/dashboard/TenantDutyCalendar";
import { AiFeatureFabs } from "../../components/dashboard/AiFeatureFabs";
import { TodayOverviewCard } from "../../components/dashboard/TodayOverviewCard";
import { DutyScheduleReport } from "../../components/dashboard/DutyScheduleReport";
import { ShiftAttendanceLog } from "../../components/dashboard/ShiftAttendanceLog";
import { PendingLeaveApprovalsCard } from "../../components/dashboard/PendingLeaveApprovalsCard";
import { MyMeetingsCard } from "../../components/dashboard/MyMeetingsCard";
import { InProgressProjectsCard } from "../../components/dashboard/InProgressProjectsCard";
import { StickyNotesBoard } from "../../components/dashboard/StickyNotesBoard";
import { MyWorkSection } from "../../components/dashboard/MyWorkSection";
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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${user?.firstName ?? ""}`}
        description="Here's what's happening across your organisation today."
        className="!mb-0"
      />

      <TodayOverviewCard summary={summary} trends={trends} />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title="Attendance Trend"
          description="Present, absent, and late counts over time."
          actions={
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
              {([7, 30] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDays(option)}
                  className={`rounded-md px-3 py-1 transition-colors ${
                    days === option ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {option} days
                </button>
              ))}
            </div>
          }
        >
          {trends ? (
            <AttendanceTrendChart points={trends.points} />
          ) : (
            <p className="text-sm text-slate-400">Loading…</p>
          )}
        </Card>

        <Card title="Leave Requests by Status" description={`Requests created in the last ${days} days.`}>
          {trends ? (
            <LeaveStatusBreakdownChart breakdown={trends.leaveStatusBreakdown} />
          ) : (
            <p className="text-sm text-slate-400">Loading…</p>
          )}
        </Card>
      </div>

      <InProgressProjectsCard />

      <StickyNotesBoard />

      {/* Managers have no Staff/Admin toggle, so their own work is shown here. */}
      {user?.role === "Manager" && <MyWorkSection />}

      <div className="grid gap-6 lg:grid-cols-2">
        <PendingLeaveApprovalsCard
          count={summary?.pendingLeaveApprovalsCount ?? 0}
          preview={summary?.pendingLeaveApprovalsPreview ?? []}
        />

        <MyMeetingsCard />
      </div>

      <DutyScheduleReport />

      <ShiftAttendanceLog />

      <TenantDutyCalendar />

      {(user?.role === "Admin" || user?.role === "HR") && <AiFeatureFabs />}
    </div>
  );
}
