import { AiKpiImpression, AiKpiMetrics, AiKpiPeriodType, AiKpiReportDto, AiKpiReportListItemDto, AiKpiScopeType } from "@hrm-plus/shared";
import { toDateKey } from "../../utils/date";

interface AiKpiReportRow {
  id: number;
  scopeType: string;
  scopeId: number;
  scopeLabel: string;
  periodType: string;
  startDate: Date;
  endDate: Date;
  employeeCount: number;
  metrics: unknown;
  impression: unknown;
  provider: string;
  model: string;
  createdAt: Date;
  generatedBy?: { email: string } | null;
}

export function toAiKpiReportDto(row: AiKpiReportRow): AiKpiReportDto {
  return {
    id: row.id,
    scopeType: row.scopeType as AiKpiScopeType,
    scopeId: row.scopeId,
    scopeLabel: row.scopeLabel,
    periodType: row.periodType as AiKpiPeriodType,
    startDate: toDateKey(row.startDate),
    endDate: toDateKey(row.endDate),
    employeeCount: row.employeeCount,
    metrics: row.metrics as AiKpiMetrics,
    impression: row.impression as AiKpiImpression,
    provider: row.provider,
    model: row.model,
    generatedByEmail: row.generatedBy?.email ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toAiKpiReportListItemDto(row: AiKpiReportRow): AiKpiReportListItemDto {
  return {
    id: row.id,
    scopeType: row.scopeType as AiKpiScopeType,
    scopeLabel: row.scopeLabel,
    periodType: row.periodType as AiKpiPeriodType,
    startDate: toDateKey(row.startDate),
    endDate: toDateKey(row.endDate),
    employeeCount: row.employeeCount,
    overallRating: (row.impression as AiKpiImpression).overall.rating,
    createdAt: row.createdAt.toISOString(),
  };
}
