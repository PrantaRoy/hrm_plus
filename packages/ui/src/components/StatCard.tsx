import { ComponentType, ReactNode } from "react";
import { cn } from "../cn";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  subtext?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, subtext, className }: StatCardProps) {
  return (
    <div className={cn("bg-white border border-slate-200 rounded-card shadow-card p-5", className)}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-600">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {subtext && <p className="mt-1 text-xs text-slate-400">{subtext}</p>}
    </div>
  );
}
