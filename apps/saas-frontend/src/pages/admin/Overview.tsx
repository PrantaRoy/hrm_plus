import { useEffect, useState } from "react";
import { Building2, Package } from "lucide-react";
import { SaasStats } from "@hrm-plus/shared";
import { PageHeader, StatCard } from "@hrm-plus/ui";
import { getStats } from "../../api/tenants";

export default function Overview() {
  const [stats, setStats] = useState<SaasStats | null>(null);

  useEffect(() => {
    getStats().then(setStats).catch(() => setStats(null));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description="A snapshot of your SaaS platform." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-2xl">
        <StatCard label="Total companies" value={stats?.totalCompanies ?? "—"} icon={Building2} />
        <StatCard label="Total packages" value={stats?.totalPackages ?? "—"} icon={Package} />
      </div>
    </div>
  );
}
