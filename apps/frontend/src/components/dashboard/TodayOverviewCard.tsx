import { ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  UserCheck,
  UserX,
} from "lucide-react";
import { DashboardSummaryDto, DashboardTrendsDto } from "@hrm-plus/shared";
import { Card } from "@hrm-plus/ui";
import { chartColors } from "./charts/chartTheme";
import { RingGauge, Sparkline } from "./charts/MiniCharts";

type Accent = "slate" | "good" | "warning" | "critical";

const ACCENT: Record<Accent, { text: string; bg: string; icon: string }> = {
  slate: { text: "text-slate-900", bg: "bg-slate-100", icon: "text-slate-500" },
  good: { text: "text-emerald-700", bg: "bg-emerald-50", icon: "text-emerald-600" },
  warning: { text: "text-amber-700", bg: "bg-amber-50", icon: "text-amber-600" },
  critical: { text: "text-rose-700", bg: "bg-rose-50", icon: "text-rose-600" },
};

interface MetricTileProps {
  label: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
  accent: Accent;
  spark?: { values: number[]; color: string };
}

function MetricTile({ label, value, icon: Icon, accent, spark }: MetricTileProps) {
  const a = ACCENT[accent];
  return (
    <div className="flex flex-col justify-between rounded-lg border border-slate-200 p-3">
      <div className="flex items-center justify-between">
        <span className={`flex h-7 w-7 items-center justify-center rounded-md ${a.bg}`}>
          <Icon className={`h-4 w-4 ${a.icon}`} />
        </span>
        {spark && <Sparkline values={spark.values} color={spark.color} />}
      </div>
      <p className={`mt-2 text-xl font-semibold tabular-nums ${a.text}`}>{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

export interface TodayOverviewCardProps {
  summary: DashboardSummaryDto | null;
  trends: DashboardTrendsDto | null;
}

export function TodayOverviewCard({ summary, trends }: TodayOverviewCardProps) {
  const present = summary?.presentToday ?? 0;
  const absent = summary?.absentToday ?? 0;
  const late = summary?.lateToday ?? 0;
  const working = present + absent;
  const rate = working > 0 ? Math.round((present / working) * 100) : null;

  const presentSeries = trends?.points.map((p) => p.present) ?? [];
  const absentSeries = trends?.points.map((p) => p.absent) ?? [];

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const pending = summary?.pendingLeaveApprovalsCount ?? 0;

  return (
    <Card
      title="Today at a glance"
      description={dateLabel}
      actions={
        <Link
          to="/leave/approvals"
          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
            pending > 0 ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "text-slate-400"
          }`}
        >
          {pending} pending approval{pending === 1 ? "" : "s"}
        </Link>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[190px_1fr] lg:items-center">
        <div className="flex items-center gap-4 lg:flex-col lg:gap-3">
          <RingGauge
            segments={[
              { label: "Present", value: present, color: chartColors.good },
              { label: "Absent", value: absent, color: chartColors.critical },
            ]}
            centerValue={rate === null ? "—" : `${rate}%`}
            centerLabel="present"
          />
          <div className="space-y-1 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors.good }} />
              Present <span className="font-semibold text-slate-900">{present}</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors.critical }} />
              Absent <span className="font-semibold text-slate-900">{absent}</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors.warning }} />
              Late <span className="font-semibold text-slate-900">{late}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MetricTile label="Duty Assigned" value={summary?.dutyAssignedToday ?? "—"} icon={ClipboardList} accent="slate" />
          <MetricTile
            label="Present"
            value={present}
            icon={UserCheck}
            accent="good"
            spark={presentSeries.length > 1 ? { values: presentSeries, color: chartColors.good } : undefined}
          />
          <MetricTile
            label="Absent"
            value={absent}
            icon={UserX}
            accent="critical"
            spark={absentSeries.length > 1 ? { values: absentSeries, color: chartColors.critical } : undefined}
          />
          <MetricTile label="Completed" value={summary?.completedToday ?? "—"} icon={CheckCircle2} accent="good" />
          <MetricTile label="Incomplete" value={summary?.incompleteToday ?? "—"} icon={AlertTriangle} accent="warning" />
          <MetricTile label="Late In" value={late} icon={Clock} accent="warning" />
        </div>
      </div>

      {working === 0 && (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
          <CalendarClock className="h-3.5 w-3.5" />
          No working duty assignments today — attendance rate will populate once shifts are rostered.
        </p>
      )}
    </Card>
  );
}
