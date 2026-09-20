import { Badge, BadgeColor } from "@hrm-plus/ui";
import { humanize } from "./format";

const TASK_STATUS_COLOR: Record<string, BadgeColor> = {
  to_do: "slate",
  in_progress: "brand",
  on_hold: "amber",
  completed: "green",
  cancelled: "red",
};

const PROJECT_STATUS_COLOR: Record<string, BadgeColor> = {
  not_started: "slate",
  in_progress: "brand",
  on_hold: "amber",
  completed: "green",
  cancelled: "red",
  archived: "slate",
};

const PRIORITY_COLOR: Record<string, BadgeColor> = {
  high: "red",
  medium: "amber",
  low: "slate",
  on_call: "brand",
};

export function TaskStatusBadge({ status }: { status: string }) {
  return <Badge color={TASK_STATUS_COLOR[status] ?? "slate"}>{humanize(status)}</Badge>;
}

export function ProjectStatusBadge({ status }: { status: string }) {
  return <Badge color={PROJECT_STATUS_COLOR[status] ?? "slate"}>{humanize(status)}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  return <Badge color={PRIORITY_COLOR[priority] ?? "slate"}>{humanize(priority)}</Badge>;
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2 min-w-[6rem]">
      <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500 tabular-nums w-8 text-right">{pct}%</span>
    </div>
  );
}
