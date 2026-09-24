import { z } from "zod";
import { PrismaClient } from "../../../generated/tenant";
import { AI_KPI_RATINGS, AiKpiImpression, AiKpiMetrics } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { getLlmProvider } from "./llmProvider.factory";

const OUTLIER_LIMIT = 5;

const sectionSchema = z.object({
  rating: z.preprocess((v) => (typeof v === "string" ? v.trim().toUpperCase().replace(/[\s-]+/g, "_") : v), z.enum(AI_KPI_RATINGS)),
  summary: z.string().trim().min(1).max(1200),
  highlights: z.array(z.string().trim().min(1).max(300)).max(6).default([]),
  concerns: z.array(z.string().trim().min(1).max(300)).max(6).default([]),
});

const impressionSchema = z.object({
  attendance: sectionSchema,
  leave: sectionSchema,
  task: sectionSchema,
  overall: sectionSchema,
});

export interface GenerateKpiImpressionParams {
  scopeLabel: string;
  employeeCount: number;
  startDate: string;
  endDate: string;
  metrics: AiKpiMetrics;
}

const SECTION_SHAPE = '{"rating": "EXCELLENT|GOOD|NEEDS_ATTENTION|CRITICAL", "summary": string, "highlights": string[], "concerns": string[]}';

// The LLM only gets aggregated numbers (plus a few named outliers for group scopes) so the prompt
// stays small and bounded no matter how big the department/designation is.
function buildPromptData(p: GenerateKpiImpressionParams) {
  const { attendance, leave, task } = p.metrics;
  const group = p.employeeCount > 1;

  const worst = <T>(rows: T[], key: (r: T) => number) => [...rows].sort((a, b) => key(a) - key(b)).slice(0, OUTLIER_LIMIT);

  return {
    scope: p.scopeLabel,
    employees: p.employeeCount,
    period: `${p.startDate} to ${p.endDate}`,
    attendance: {
      totals: attendance.totals,
      ...(group
        ? {
            lowestAttendance: worst(
              attendance.employees.filter((e) => e.scheduledDays > 0),
              (e) => e.attendanceRate ?? 100
            ).map((e) => ({ name: e.employeeName, rate: e.attendanceRate, absent: e.absentDays, late: e.lateCount })),
          }
        : {}),
    },
    leave: {
      totals: leave.totals,
      ...(group
        ? {
            mostLeaveDays: worst(
              leave.employees.filter((e) => e.approvedDays > 0),
              (e) => -e.approvedDays
            ).map((e) => ({ name: e.employeeName, approvedDays: e.approvedDays, remainingBalance: e.remainingBalanceDays })),
          }
        : {}),
    },
    tasks: {
      totals: task.totals,
      ...(group
        ? {
            mostOverdue: worst(
              task.employees.filter((e) => e.overdueOpen > 0),
              (e) => -e.overdueOpen
            ).map((e) => ({ name: e.employeeName, overdue: e.overdueOpen, onTimeRate: e.onTimeRate })),
          }
        : {}),
    },
  };
}

export async function generateKpiImpression(
  prisma: PrismaClient,
  params: GenerateKpiImpressionParams
): Promise<AiKpiImpression> {
  const system =
    "You are an HR analytics assistant writing performance impressions for HR staff from pre-computed workforce metrics. " +
    "Judge ONLY from the numbers provided; never invent facts or recompute figures. " +
    "Leave taken within entitlement is a normal right and is not a negative by itself; comment on leave only in terms of volume, pending requests and remaining balance. " +
    "Do not speculate about health, personal circumstances, or any protected characteristic. " +
    'If a section has no activity (for example zero scheduled days or zero tasks due), say "Insufficient data" in its summary and rate it GOOD with no concerns. ' +
    "Be concise and specific, citing figures. For a group, refer to named individuals only when they appear in the outlier lists. " +
    `Respond with ONLY JSON of the form {"attendance": S, "leave": S, "task": S, "overall": S} where each S is ${SECTION_SHAPE}. ` +
    '"summary" is 2-3 sentences; "highlights" and "concerns" hold at most 4 short items each. ' +
    '"overall" combines all three areas into one verdict and recommended follow-up for HR.';

  const prompt = `Metrics (JSON):\n${JSON.stringify(buildPromptData(params))}`;

  const provider = await getLlmProvider(prisma);
  const raw = await provider.generateJson<unknown>({ system, prompt, maxTokens: 1800 });

  const parsed = impressionSchema.safeParse(raw);
  if (!parsed.success) {
    throw ApiError.badRequest("AI returned an invalid KPI impression", "LLM_INVALID_OUTPUT");
  }
  return parsed.data;
}
