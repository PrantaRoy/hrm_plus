import { PrismaClient } from "../../../generated/tenant";
import {
  AiKpiReportDto,
  AiKpiReportPaginatedResult,
  GenerateAiKpiReportInput,
  ListAiKpiReportsQuery,
} from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { toDateKey } from "../../utils/date";
import { generateKpiImpression } from "../llm/kpiImpression";
import { getLlmProvider, getLlmProviderInfo } from "../llm/llmProvider.factory";
import { toAiKpiReportDto, toAiKpiReportListItemDto } from "./aiKpiReport.mapper";
import { resolvePeriod, resolveScope } from "./aiKpiScope.service";
import { computeKpiMetrics } from "./kpiMetrics.service";

export async function generateAiKpiReport(
  prisma: PrismaClient,
  input: GenerateAiKpiReportInput,
  generatedById: number
): Promise<AiKpiReportDto> {
  const period = resolvePeriod(input.period);
  const scope = await resolveScope(prisma, input.scope);

  // Fail fast (before the metric queries) when no LLM is configured for this tenant.
  await getLlmProvider(prisma);

  const metrics = await computeKpiMetrics(prisma, scope.employees, period);
  const impression = await generateKpiImpression(prisma, {
    scopeLabel: scope.label,
    employeeCount: scope.employees.length,
    startDate: toDateKey(period.startDate),
    endDate: toDateKey(period.endDate),
    metrics,
  });
  const { provider, model } = await getLlmProviderInfo(prisma);

  const saved = await prisma.aiKpiReport.create({
    data: {
      scopeType: input.scope.type,
      scopeId: input.scope.id,
      scopeLabel: scope.label,
      periodType: input.period.type,
      startDate: period.startDate,
      endDate: period.endDate,
      employeeCount: scope.employees.length,
      metrics: metrics as object,
      impression: impression as object,
      provider,
      model,
      generatedById,
    },
    include: { generatedBy: { select: { email: true } } },
  });
  return toAiKpiReportDto(saved);
}

export async function listAiKpiReports(
  prisma: PrismaClient,
  query: Required<ListAiKpiReportsQuery>
): Promise<AiKpiReportPaginatedResult> {
  const [total, rows] = await Promise.all([
    prisma.aiKpiReport.count(),
    prisma.aiKpiReport.findMany({
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);
  return { items: rows.map(toAiKpiReportListItemDto), total, page: query.page, pageSize: query.pageSize };
}

export async function getAiKpiReport(prisma: PrismaClient, id: number): Promise<AiKpiReportDto> {
  const row = await prisma.aiKpiReport.findUnique({ where: { id }, include: { generatedBy: { select: { email: true } } } });
  if (!row) throw ApiError.notFound("AI KPI report not found");
  return toAiKpiReportDto(row);
}

export async function deleteAiKpiReport(prisma: PrismaClient, id: number): Promise<void> {
  const existing = await prisma.aiKpiReport.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw ApiError.notFound("AI KPI report not found");
  await prisma.aiKpiReport.delete({ where: { id } });
}
