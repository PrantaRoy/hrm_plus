import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  Inbox,
  LifeBuoy,
  Package,
  Plus,
} from "lucide-react";
import { SaasStats } from "@hrm-plus/shared";
import { Alert, Badge, Button, Card, EmptyState, PageHeader, Spinner, StatCard, StatusPill } from "@hrm-plus/ui";
import { getStats } from "../../api/tenants";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year!, month! - 1, 1).toLocaleDateString(undefined, { month: "short" });
}

function BarList({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate font-medium text-slate-700">{row.label}</span>
            <span className="ml-3 tabular-nums text-slate-500">{row.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function MonthlyBars({ data }: { data: SaasStats["applicationsByMonth"] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex h-44 items-end gap-3">
      {data.map((d) => (
        <div key={d.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <span className="text-xs font-medium tabular-nums text-slate-600">{d.count}</span>
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-md bg-brand-500/80 transition-all hover:bg-brand-600"
              style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 6 : 2)}%` }}
              title={`${monthLabel(d.month)}: ${d.count}`}
            />
          </div>
          <span className="text-[11px] uppercase tracking-wide text-slate-400">{monthLabel(d.month)}</span>
        </div>
      ))}
    </div>
  );
}

export default function Overview() {
  const [stats, setStats] = useState<SaasStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setError("Could not load platform statistics."))
      .finally(() => setLoading(false));
  }, []);

  const dash = (value: number | undefined) => (value === undefined ? "—" : value);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform overview"
        description="Companies, applications and support activity across your SaaS platform."
        actions={
          <>
            <Link to="/admin/packages">
              <Button variant="secondary" size="sm">
                <Package className="h-3.5 w-3.5" />
                New package
              </Button>
            </Link>
            <Link to="/admin/tenants/new">
              <Button size="sm">
                <Plus className="h-3.5 w-3.5" />
                New company
              </Button>
            </Link>
          </>
        }
        className="!mb-0"
      />

      {error && <Alert>{error}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total companies"
          value={dash(stats?.totalCompanies)}
          icon={Building2}
          subtext={stats ? `${stats.activeCompanies} active` : undefined}
        />
        <StatCard
          label="Active companies"
          value={dash(stats?.activeCompanies)}
          icon={CheckCircle2}
          tone="emerald"
          subtext="Currently using the platform"
        />
        <StatCard
          label="Pending applications"
          value={dash(stats?.pendingApplications)}
          icon={FileText}
          tone="amber"
          subtext="Awaiting review"
        />
        <StatCard
          label="Open support tickets"
          value={dash(stats?.openTickets)}
          icon={LifeBuoy}
          tone="rose"
          subtext="Pending, open or on hold"
        />
        <StatCard
          label="Unread messages"
          value={dash(stats?.unreadContacts)}
          icon={Inbox}
          tone="sky"
          subtext="Landing page contact form"
        />
        <StatCard label="Packages" value={dash(stats?.totalPackages)} icon={Package} tone="slate" />
      </div>

      {loading && !stats ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        stats && (
          <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              <Card
                className="lg:col-span-3"
                title="Recent applications"
                description="Latest company sign-up requests"
                actions={
                  <Link
                    to="/admin/applications"
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                }
                noPadding
              >
                {stats.recentApplications.length === 0 ? (
                  <EmptyState icon={FileText} title="No applications yet" />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {stats.recentApplications.map((app) => (
                      <li key={app.id}>
                        <Link
                          to={`/admin/applications/${app.id}`}
                          className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-brand-50/40 sm:px-6"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">{app.companyName}</p>
                            <p className="truncate text-xs text-slate-500">{app.companyType}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="hidden text-xs text-slate-400 sm:inline">
                              {formatDate(app.submittedAt)}
                            </span>
                            <StatusPill status={app.status} />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="lg:col-span-2" title="Applications" description="Last 6 months">
                <MonthlyBars data={stats.applicationsByMonth} />
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              <Card className="lg:col-span-2" title="Companies by package" description="Where your tenants sit">
                {stats.companiesByPackage.length === 0 ? (
                  <EmptyState icon={Package} title="No companies yet" />
                ) : (
                  <BarList rows={stats.companiesByPackage.map((r) => ({ label: r.packageName, value: r.count }))} />
                )}
              </Card>

              <Card
                className="lg:col-span-3"
                title="Open support tickets"
                description="Newest first"
                actions={
                  <Link
                    to="/admin/support-tickets"
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                }
                noPadding
              >
                {stats.recentTickets.length === 0 ? (
                  <EmptyState icon={LifeBuoy} title="No open tickets" description="Everything is resolved." />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {stats.recentTickets.map((ticket) => (
                      <li key={ticket.id}>
                        <Link
                          to={`/admin/support-tickets/${ticket.id}`}
                          className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-brand-50/40 sm:px-6"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">{ticket.subject}</p>
                            <p className="truncate text-xs text-slate-500">
                              {ticket.companyName} · {formatDate(ticket.createdAt)}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {ticket.priority && <Badge color="slate">{ticket.priority}</Badge>}
                            <StatusPill status={ticket.status} />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </>
        )
      )}
    </div>
  );
}
