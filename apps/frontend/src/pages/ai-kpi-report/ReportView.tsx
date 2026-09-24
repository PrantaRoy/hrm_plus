import { ReactNode } from "react";
import { CalendarOff, CheckCircle2, ClipboardList, Clock, Sparkles, UserCheck } from "lucide-react";
import { AiKpiReportDto, AiKpiSectionImpression } from "@hrm-plus/shared";
import { Alert, Badge, Card, StatCard, Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@hrm-plus/ui";
import { RATING_COLOR, RATING_LABEL, formatDate, formatDateTime, formatMinutes, formatPercent } from "./kpiFormat";

function Impression({ impression }: { impression: AiKpiSectionImpression }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <Badge color={RATING_COLOR[impression.rating]} className="shrink-0">
          {RATING_LABEL[impression.rating]}
        </Badge>
        <p className="text-sm text-slate-700">{impression.summary}</p>
      </div>
      {(impression.highlights.length > 0 || impression.concerns.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {impression.highlights.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">Highlights</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                {impression.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
          )}
          {impression.concerns.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">Concerns</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                {impression.concerns.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  impression,
  stats,
  table,
}: {
  title: string;
  impression: AiKpiSectionImpression;
  stats: ReactNode;
  table?: ReactNode;
}) {
  return (
    <Card title={title}>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats}</div>
        <Impression impression={impression} />
        {table}
      </div>
    </Card>
  );
}

export default function ReportView({ report }: { report: AiKpiReportDto }) {
  const { metrics, impression } = report;
  const a = metrics.attendance.totals;
  const l = metrics.leave.totals;
  const t = metrics.task.totals;
  const isGroup = report.employeeCount > 1;

  return (
    <div className="space-y-5">
      <Card
        title={
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-600" />
            Overall impression — {report.scopeLabel}
          </span>
        }
        description={`${formatDate(report.startDate)} – ${formatDate(report.endDate)} · ${report.employeeCount} ${
          report.employeeCount === 1 ? "employee" : "employees"
        } · generated ${formatDateTime(report.createdAt)}${report.generatedByEmail ? ` by ${report.generatedByEmail}` : ""}`}
      >
        <Impression impression={impression.overall} />
        <p className="mt-4 text-xs text-slate-400">
          AI-generated impression based on recorded data ({report.provider} · {report.model}). Verify before acting.
        </p>
      </Card>

      <Section
        title="Attendance"
        impression={impression.attendance}
        stats={
          <>
            <StatCard label="Attendance rate" value={formatPercent(a.attendanceRate)} icon={UserCheck} tone="emerald" subtext={`${a.presentDays} of ${a.scheduledDays} scheduled days`} />
            <StatCard label="Absent days" value={a.absentDays} icon={CalendarOff} tone="rose" />
            <StatCard label="Late arrivals" value={a.lateCount} icon={Clock} tone="amber" subtext={a.lateCount ? `avg ${a.averageLateMinutes} min late` : undefined} />
            <StatCard label="Hours worked" value={formatMinutes(a.workedMinutes)} icon={Clock} tone="sky" subtext={`${formatMinutes(a.overtimeMinutes)} overtime · ${a.earlyCheckoutCount} early checkouts`} />
          </>
        }
        table={
          isGroup && (
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Employee</TableHeaderCell>
                  <TableHeaderCell>Rate</TableHeaderCell>
                  <TableHeaderCell>Present / Scheduled</TableHeaderCell>
                  <TableHeaderCell>Absent</TableHeaderCell>
                  <TableHeaderCell>Late</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {metrics.attendance.employees.map((e) => (
                  <TableRow key={e.employeeId}>
                    <TableCell>{e.employeeName}</TableCell>
                    <TableCell>{formatPercent(e.attendanceRate)}</TableCell>
                    <TableCell>
                      {e.presentDays} / {e.scheduledDays}
                    </TableCell>
                    <TableCell>{e.absentDays}</TableCell>
                    <TableCell>{e.lateCount}</TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )
        }
      />

      <Section
        title="Leave"
        impression={impression.leave}
        stats={
          <>
            <StatCard label="Approved leave days" value={l.approvedDays} icon={CalendarOff} tone="sky" subtext={`${l.approvedRequests} approved requests`} />
            <StatCard label="Pending" value={l.pendingRequests} icon={Clock} tone="amber" subtext={`${l.pendingDays} days awaiting approval`} />
            <StatCard label="Rejected / cancelled" value={`${l.rejectedRequests} / ${l.cancelledRequests}`} icon={CalendarOff} tone="slate" />
            <StatCard label="Remaining balance" value={`${l.remainingBalanceDays} days`} icon={CheckCircle2} tone="emerald" subtext={l.daysByLeaveType.map((d) => `${d.leaveTypeName}: ${d.days}d`).join(" · ") || undefined} />
          </>
        }
        table={
          isGroup && (
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Employee</TableHeaderCell>
                  <TableHeaderCell>Approved days</TableHeaderCell>
                  <TableHeaderCell>Pending days</TableHeaderCell>
                  <TableHeaderCell>Balance left</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {metrics.leave.employees.map((e) => (
                  <TableRow key={e.employeeId}>
                    <TableCell>{e.employeeName}</TableCell>
                    <TableCell>{e.approvedDays}</TableCell>
                    <TableCell>{e.pendingDays}</TableCell>
                    <TableCell>{e.remainingBalanceDays}</TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )
        }
      />

      <Section
        title="Task deadlines"
        impression={impression.task}
        stats={
          <>
            <StatCard label="On-time rate" value={formatPercent(t.onTimeRate)} icon={CheckCircle2} tone="emerald" subtext={`${t.dueInPeriod} tasks due in period`} />
            <StatCard label="Completed on time / late" value={`${t.completedOnTime} / ${t.completedLate}`} icon={ClipboardList} tone="sky" />
            <StatCard label="Overdue (open)" value={t.overdueOpen} icon={CalendarOff} tone="rose" subtext={t.averageOpenProgress === null ? undefined : `avg progress ${t.averageOpenProgress}%`} />
            <StatCard label="Hours logged" value={`${t.hoursLogged}h`} icon={Clock} tone="slate" subtext={`${t.openNotYetDue} open, not yet due`} />
          </>
        }
        table={
          isGroup && (
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Employee</TableHeaderCell>
                  <TableHeaderCell>Due</TableHeaderCell>
                  <TableHeaderCell>On time / late</TableHeaderCell>
                  <TableHeaderCell>Overdue</TableHeaderCell>
                  <TableHeaderCell>On-time rate</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {metrics.task.employees.map((e) => (
                  <TableRow key={e.employeeId}>
                    <TableCell>{e.employeeName}</TableCell>
                    <TableCell>{e.dueInPeriod}</TableCell>
                    <TableCell>
                      {e.completedOnTime} / {e.completedLate}
                    </TableCell>
                    <TableCell>{e.overdueOpen}</TableCell>
                    <TableCell>{formatPercent(e.onTimeRate)}</TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )
        }
      />

      <Alert tone="info">
        Metrics are computed from attendance, leave and task records for the selected period. The impressions are advisory
        and should be reviewed by HR before any decision.
      </Alert>
    </div>
  );
}
