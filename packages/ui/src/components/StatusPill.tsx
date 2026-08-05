import { Badge, BadgeColor } from "./Badge";

export type KnownStatus =
  | "Active"
  | "Inactive"
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Scheduled"
  | "CheckedIn"
  | "Completed"
  | "OnLeave"
  | "Incomplete"
  | "Cancelled"
  | "Issued";

const statusColor: Record<KnownStatus, BadgeColor> = {
  Active: "green",
  Approved: "green",
  Completed: "green",
  Issued: "green",
  Inactive: "slate",
  Scheduled: "slate",
  Pending: "amber",
  OnLeave: "amber",
  CheckedIn: "brand",
  Rejected: "red",
  Incomplete: "red",
  Cancelled: "red",
};

const statusLabel: Partial<Record<KnownStatus, string>> = {
  OnLeave: "Leave",
  CheckedIn: "Checked In",
};

export interface StatusPillProps {
  status: string;
}

export function StatusPill({ status }: StatusPillProps) {
  const color = statusColor[status as KnownStatus] ?? "slate";
  const label = statusLabel[status as KnownStatus] ?? status;
  return <Badge color={color}>{label}</Badge>;
}
