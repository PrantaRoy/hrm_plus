import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Trash2 } from "lucide-react";
import {
  AI_KPI_SCOPE_TYPES,
  AiKpiPeriodType,
  AiKpiReportDto,
  AiKpiReportListItemDto,
  AiKpiScopeType,
  DepartmentDto,
  DesignationDto,
  EmployeeDto,
} from "@hrm-plus/shared";
import { Alert, Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Spinner, cn } from "@hrm-plus/ui";
import { deleteAiKpiReport, generateAiKpiReport, getAiKpiReport, listAiKpiReports } from "../../api/aiKpiReports";
import { listDepartments } from "../../api/departments";
import { listDesignations } from "../../api/designations";
import { listEmployees } from "../../api/employees";
import ReportView from "./ReportView";
import { RATING_COLOR, RATING_LABEL, SCOPE_TYPE_LABEL, formatDate, formatDateTime } from "./kpiFormat";

const PERIOD_OPTIONS: Array<{ value: AiKpiPeriodType; label: string }> = [
  { value: "LAST_2_WEEKS", label: "Last 2 weeks" },
  { value: "LAST_4_WEEKS", label: "Last 4 weeks" },
  { value: "CUSTOM", label: "Custom range" },
];

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
const apiError = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { error?: { message?: string; code?: string } } } }).response?.data?.error?.message ?? fallback;
const apiErrorCode = (err: unknown) =>
  (err as { response?: { data?: { error?: { code?: string } } } }).response?.data?.error?.code;

export default function AiKpiReport() {
  const [scopeType, setScopeType] = useState<AiKpiScopeType>("EMPLOYEE");
  const [scopeId, setScopeId] = useState("");
  const [periodType, setPeriodType] = useState<AiKpiPeriodType>("LAST_2_WEEKS");
  const [startDate, setStartDate] = useState(daysAgo(13));
  const [endDate, setEndDate] = useState(today());

  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [designations, setDesignations] = useState<DesignationDto[]>([]);

  const [report, setReport] = useState<AiKpiReportDto | null>(null);
  const [history, setHistory] = useState<AiKpiReportListItemDto[]>([]);
  const [generating, setGenerating] = useState(false);
  const [opening, setOpening] = useState<number | null>(null);
  const [error, setError] = useState<{ message: string; needsSetup: boolean } | null>(null);

  const loadHistory = useCallback(() => {
    listAiKpiReports({ page: 1, pageSize: 20 })
      .then((res) => setHistory(res.items))
      .catch(() => setHistory([]));
  }, []);

  useEffect(() => {
    listEmployees({ pageSize: 500 }).then((r) => setEmployees(r.items)).catch(() => setEmployees([]));
    listDepartments().then(setDepartments).catch(() => setDepartments([]));
    listDesignations().then(setDesignations).catch(() => setDesignations([]));
    loadHistory();
  }, [loadHistory]);

  useEffect(() => setScopeId(""), [scopeType]);

  const scopeOptions =
    scopeType === "EMPLOYEE"
      ? employees.map((e) => ({ id: e.id, label: `${e.firstName} ${e.lastName}` }))
      : scopeType === "DEPARTMENT"
        ? departments.map((d) => ({ id: d.id, label: d.name }))
        : designations.map((d) => ({ id: d.id, label: d.name }));

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    if (!scopeId) return;
    setGenerating(true);
    setError(null);
    try {
      const created = await generateAiKpiReport({
        scope: { type: scopeType, id: Number(scopeId) },
        period: periodType === "CUSTOM" ? { type: periodType, startDate, endDate } : { type: periodType },
      });
      setReport(created);
      loadHistory();
    } catch (err) {
      setError({ message: apiError(err, "Failed to generate the report"), needsSetup: apiErrorCode(err) === "LLM_NOT_CONFIGURED" });
    } finally {
      setGenerating(false);
    }
  }

  async function openReport(id: number) {
    setOpening(id);
    setError(null);
    try {
      setReport(await getAiKpiReport(id));
    } catch (err) {
      setError({ message: apiError(err, "Failed to open the report"), needsSetup: false });
    } finally {
      setOpening(null);
    }
  }

  async function removeReport(id: number) {
    if (!window.confirm("Delete this saved report?")) return;
    try {
      await deleteAiKpiReport(id);
      if (report?.id === id) setReport(null);
      loadHistory();
    } catch (err) {
      setError({ message: apiError(err, "Failed to delete the report"), needsSetup: false });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI KPI Report"
        description="AI-written impressions of attendance, leave and task deadlines for an employee, department or designation."
      />

      <Card>
        <form onSubmit={handleGenerate} className="flex flex-wrap items-end gap-3">
          <Field label="Report for">
            <Select value={scopeType} onChange={(e) => setScopeType(e.target.value as AiKpiScopeType)}>
              {AI_KPI_SCOPE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SCOPE_TYPE_LABEL[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={SCOPE_TYPE_LABEL[scopeType]}>
            <Select value={scopeId} onChange={(e) => setScopeId(e.target.value)} required>
              <option value="">Select {SCOPE_TYPE_LABEL[scopeType].toLowerCase()}…</option>
              {scopeOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Period">
            <Select value={periodType} onChange={(e) => setPeriodType(e.target.value as AiKpiPeriodType)}>
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          {periodType === "CUSTOM" && (
            <>
              <Field label="From">
                <Input type="date" value={startDate} max={endDate} onChange={(e) => setStartDate(e.target.value)} required />
              </Field>
              <Field label="To">
                <Input type="date" value={endDate} min={startDate} max={today()} onChange={(e) => setEndDate(e.target.value)} required />
              </Field>
            </>
          )}
          <Button type="submit" isLoading={generating} disabled={!scopeId || generating}>
            <Sparkles className="h-4 w-4" />
            Generate report
          </Button>
        </form>
      </Card>

      {error && (
        <Alert tone="error">
          {error.message}
          {error.needsSetup && (
            <>
              {" "}
              <Link to="/settings/ai" className="underline">
                Configure AI settings
              </Link>
            </>
          )}
        </Alert>
      )}

      {generating && (
        <div className="flex items-center gap-3 rounded-card border border-slate-200/70 bg-white p-5 text-sm text-slate-600">
          <Spinner /> Computing metrics and asking the AI for its impression — this can take a few seconds…
        </div>
      )}

      {!generating && report && <ReportView report={report} />}

      <Card title="Previous reports" description="Reopening a saved report does not call the AI again.">
        {history.length === 0 ? (
          <EmptyState title="No reports yet" description="Generated reports will be listed here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {history.map((h) => (
              <li key={h.id} className={cn("flex items-center gap-3 py-2.5", report?.id === h.id && "bg-brand-50/40")}>
                <button
                  type="button"
                  onClick={() => openReport(h.id)}
                  className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-left"
                  disabled={opening === h.id}
                >
                  <span className="truncate text-sm font-medium text-slate-800">{h.scopeLabel}</span>
                  <span className="text-xs text-slate-500">
                    {formatDate(h.startDate)} – {formatDate(h.endDate)}
                  </span>
                  <Badge color={RATING_COLOR[h.overallRating]}>{RATING_LABEL[h.overallRating]}</Badge>
                  <span className="text-xs text-slate-400">{formatDateTime(h.createdAt)}</span>
                </button>
                {opening === h.id && <Spinner size="sm" />}
                <Button type="button" variant="ghost" size="sm" onClick={() => removeReport(h.id)} aria-label="Delete report">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
