import { useEffect, useState } from "react";
import { SaasStats } from "@hrm-plus/shared";
import { getStats } from "../../api/tenants";

export default function Overview() {
  const [stats, setStats] = useState<SaasStats | null>(null);

  useEffect(() => {
    getStats().then(setStats).catch(() => setStats(null));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Overview</h1>
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <StatCard label="Total companies" value={stats?.totalCompanies} />
        <StatCard label="Total packages" value={stats?.totalPackages} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value?: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-bold text-slate-900 mt-1">{value ?? "—"}</p>
    </div>
  );
}
