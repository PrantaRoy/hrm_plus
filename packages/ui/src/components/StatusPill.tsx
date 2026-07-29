import { Badge, BadgeColor } from "./Badge";

export type KnownStatus = "Active" | "Inactive" | "Pending" | "Approved" | "Rejected";

const statusColor: Record<KnownStatus, BadgeColor> = {
  Active: "green",
  Approved: "green",
  Inactive: "slate",
  Pending: "amber",
  Rejected: "red",
};

export interface StatusPillProps {
  status: string;
}

export function StatusPill({ status }: StatusPillProps) {
  const color = statusColor[status as KnownStatus] ?? "slate";
  return <Badge color={color}>{status}</Badge>;
}
