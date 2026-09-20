import { HTMLAttributes, ReactNode } from "react";
import { cn } from "../cn";

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  noPadding?: boolean;
}

export function Card({ title, description, actions, noPadding, className, children, ...props }: CardProps) {
  const hasHeader = title || description || actions;
  return (
    <div
      className={cn("bg-white border border-slate-200/70 rounded-card shadow-card", className)}
      {...props}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6 border-b border-slate-100">
          <div>
            {title && <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? undefined : "p-5 sm:p-6"}>{children}</div>
    </div>
  );
}
