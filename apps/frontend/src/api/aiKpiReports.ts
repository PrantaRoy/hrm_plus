import {
  AiKpiReportDto,
  AiKpiReportPaginatedResult,
  GenerateAiKpiReportInput,
  ListAiKpiReportsQuery,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function generateAiKpiReport(input: GenerateAiKpiReportInput): Promise<AiKpiReportDto> {
  // The LLM call can take a while on free-tier providers, so allow more than the default timeout.
  const res = await apiClient.post<AiKpiReportDto>("/ai-kpi-reports", input, { timeout: 120_000 });
  return res.data;
}

export async function listAiKpiReports(query: ListAiKpiReportsQuery = {}): Promise<AiKpiReportPaginatedResult> {
  const res = await apiClient.get<AiKpiReportPaginatedResult>("/ai-kpi-reports", { params: query });
  return res.data;
}

export async function getAiKpiReport(id: number): Promise<AiKpiReportDto> {
  const res = await apiClient.get<AiKpiReportDto>(`/ai-kpi-reports/${id}`);
  return res.data;
}

export async function deleteAiKpiReport(id: number): Promise<void> {
  await apiClient.delete(`/ai-kpi-reports/${id}`);
}
