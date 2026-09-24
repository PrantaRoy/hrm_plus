import { AiKpiRating } from "@hrm-plus/shared";
import { BadgeColor } from "@hrm-plus/ui";

export const RATING_LABEL: Record<AiKpiRating, string> = {
  EXCELLENT: "Excellent",
  GOOD: "Good",
  NEEDS_ATTENTION: "Needs attention",
  CRITICAL: "Critical",
};

export const RATING_COLOR: Record<AiKpiRating, BadgeColor> = {
  EXCELLENT: "green",
  GOOD: "brand",
  NEEDS_ATTENTION: "amber",
  CRITICAL: "red",
};

export function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export const formatPercent = (value: number | null): string => (value === null ? "—" : `${value}%`);

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export const SCOPE_TYPE_LABEL = { EMPLOYEE: "Employee", DEPARTMENT: "Department", DESIGNATION: "Designation" } as const;
