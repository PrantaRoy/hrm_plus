import { HTMLAttributes } from "react";
import { cn } from "../cn";

export type BadgeColor = "slate" | "green" | "amber" | "red" | "brand";

const colorClasses: Record<BadgeColor, string> = {
  slate: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200/70",
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/70",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/70",
  red: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200/70",
  brand: "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200/70",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
}

export function Badge({ color = "slate", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colorClasses[color],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
