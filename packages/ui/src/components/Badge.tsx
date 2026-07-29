import { HTMLAttributes } from "react";
import { cn } from "../cn";

export type BadgeColor = "slate" | "green" | "amber" | "red" | "brand";

const colorClasses: Record<BadgeColor, string> = {
  slate: "bg-slate-100 text-slate-600",
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  brand: "bg-brand-50 text-brand-700",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
}

export function Badge({ color = "slate", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
        colorClasses[color],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
