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
  | "Cancelled";

const statusColor: Record<KnownStatus, BadgeColor> = {
  Active: "green",
  Approved: "green",
  Completed: "green",
  Inactive: "slate",
  Scheduled: "slate",
  Pending: "amber",
  OnLeave: "amber",
  CheckedIn: "brand",
  Rejected: "red",
  Incomplete: "red",
  Cancelled: "red",
};

export interface StatusPillProps {
  status: string;
}

export function StatusPill({ status }: StatusPillProps) {
  const color = statusColor[status as KnownStatus] ?? "slate";
  return <Badge color={color}>{status}</Badge>;
}
