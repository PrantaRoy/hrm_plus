import { useMemo, useState } from "react";
import { DashboardLeaveStatusCountDto, LeaveRequestStatus } from "@hrm-plus/shared";
import { Button } from "@hrm-plus/ui";
import { chartColors } from "./chartTheme";
import { ChartLegend, ChartTooltip } from "./ChartPrimitives";

const STATUS_COLOR: Record<LeaveRequestStatus, string> = {
  Approved: chartColors.good,
  Pending: chartColors.warning,
  Rejected: chartColors.critical,
  Cancelled: chartColors.muted,
};

const STATUS_ORDER: LeaveRequestStatus[] = ["Approved", "Pending", "Rejected", "Cancelled"];

export interface LeaveStatusBreakdownChartProps {
  breakdown: DashboardLeaveStatusCountDto[];
}

export function LeaveStatusBreakdownChart({ breakdown }: LeaveStatusBreakdownChartProps) {
  const [hoverStatus, setHoverStatus] = useState<LeaveRequestStatus | null>(null);
  const [showTable, setShowTable] = useState(false);

  const countByStatus = useMemo(() => {
    const map = new Map<LeaveRequestStatus, number>();
    for (const row of breakdown) map.set(row.status, row.count);
    return map;
  }, [breakdown]);

  const total = STATUS_ORDER.reduce((sum, s) => sum + (countByStatus.get(s) ?? 0), 0);

  if (total === 0) {
    return <p className="text-sm text-slate-400">No leave requests in this range yet.</p>;
  }

  const rawSegments = STATUS_ORDER.map((status) => ({
    status,
    count: countByStatus.get(status) ?? 0,
    pct: ((countByStatus.get(status) ?? 0) / total) * 100,
  })).filter((s) => s.count > 0);

  const segments = rawSegments.reduce<Array<(typeof rawSegments)[number] & { startPct: number }>>((acc, s) => {
    const startPct = acc.length > 0 ? acc[acc.length - 1].startPct + acc[acc.length - 1].pct : 0;
    acc.push({ ...s, startPct });
    return acc;
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <ChartLegend items={segments.map((s) => ({ label: s.status, color: STATUS_COLOR[s.status], value: s.count }))} />
        <Button variant="secondary" size="sm" onClick={() => setShowTable((v) => !v)}>
          {showTable ? "View chart" : "View as table"}
        </Button>
      </div>

      {showTable ? (
        <table className="w-full text-sm">
          <thead className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-1.5">Status</th>
              <th className="py-1.5">Count</th>
              <th className="py-1.5">Percent</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((s) => (
              <tr key={s.status} className="border-t border-slate-100">
                <td className="py-1.5 text-slate-900">{s.status}</td>
                <td className="py-1.5 text-slate-600">{s.count}</td>
                <td className="py-1.5 text-slate-600">{s.pct.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative pt-6">
          <div className="flex h-6 w-full overflow-hidden rounded-full bg-slate-100" style={{ gap: 2 }}>
            {segments.map((s) => (
              <div
                key={s.status}
                className="h-full first:rounded-l-full last:rounded-r-full"
                style={{ width: `${s.pct}%`, backgroundColor: STATUS_COLOR[s.status] }}
                onMouseEnter={() => setHoverStatus(s.status)}
                onMouseLeave={() => setHoverStatus(null)}
              />
            ))}
          </div>
          {segments.map((s) => {
            if (hoverStatus !== s.status) return null;
            const leftPct = s.startPct + s.pct / 2;
            return (
              <ChartTooltip key={s.status} leftPct={leftPct} topPct={0}>
                <p className="font-medium text-slate-900">{s.status}</p>
                <p className="text-slate-600">
                  {s.count} ({s.pct.toFixed(1)}%)
                </p>
              </ChartTooltip>
            );
          })}
        </div>
      )}
    </div>
  );
}
