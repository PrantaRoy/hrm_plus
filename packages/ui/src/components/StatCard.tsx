import { ComponentType, ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "../cn";

export type StatTone = "brand" | "emerald" | "amber" | "rose" | "sky" | "slate";

const toneClasses: Record<StatTone, string> = {
  brand: "bg-brand-50 text-brand-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  sky: "bg-sky-50 text-sky-600",
  slate: "bg-slate-100 text-slate-600",
};

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  subtext?: ReactNode;
  /** Colour of the icon chip. */
  tone?: StatTone;
  /** Optional change indicator, e.g. { value: "+12%", direction: "up" }. */
  trend?: { value: string; direction: "up" | "down" | "flat"; positive?: boolean };
  className?: string;
}

export function StatCard({ label, value, icon: Icon, subtext, tone = "brand", trend, className }: StatCardProps) {
  const trendGood = trend ? (trend.positive ?? trend.direction !== "down") : true;
  return (
    <div
      className={cn(
        "rounded-card border border-slate-200/70 bg-white p-5 shadow-card transition-shadow hover:shadow-pop",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon && (
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", toneClasses[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      {(trend || subtext) && (
        <div className="mt-1.5 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
                trend.direction === "flat"
                  ? "bg-slate-100 text-slate-600"
                  : trendGood
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
              )}
            >
              {trend.direction === "up" && <ArrowUpRight className="h-3 w-3" />}
              {trend.direction === "down" && <ArrowDownRight className="h-3 w-3" />}
              {trend.value}
            </span>
          )}
          {subtext && <span className="text-slate-400">{subtext}</span>}
        </div>
      )}
    </div>
  );
}
