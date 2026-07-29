import { ComponentType, ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "../cn";

export interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 py-12 text-center", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="text-xs text-slate-400 max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
