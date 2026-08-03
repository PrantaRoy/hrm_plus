import { ReactNode } from "react";

export interface ChartLegendItem {
  label: string;
  color: string;
  value?: string | number;
}

export function ChartLegend({ items }: { items: ChartLegendItem[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
          <span>
            {item.label}
            {item.value !== undefined && <span className="ml-1 font-medium text-slate-900">{item.value}</span>}
          </span>
        </span>
      ))}
    </div>
  );
}

export interface ChartTooltipProps {
  /** Percent (0-100) position within the chart's positioned container. */
  leftPct: number;
  topPct: number;
  children: ReactNode;
}

export function ChartTooltip({ leftPct, topPct, children }: ChartTooltipProps) {
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-card"
      style={{ left: `${leftPct}%`, top: `${topPct}%` }}
    >
      {children}
    </div>
  );
}
