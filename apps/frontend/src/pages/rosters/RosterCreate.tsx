import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DepartmentDto, ROSTER_PERIOD_TYPES, RosterPeriodType } from "@hrm-plus/shared";
import { Button, Card, Field, Input, PageHeader, Select } from "@hrm-plus/ui";
import { createRoster } from "../../api/rosters";
import { listDepartments } from "../../api/departments";

const PERIOD_DAYS: Record<RosterPeriodType, number> = {
  Weekly: 6,
  Fortnightly: 13,
  Monthly: 29,
};

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function suggestEndDate(startDate: string, periodType: RosterPeriodType): string {
  if (!startDate) return "";
  const start = new Date(startDate);
  start.setDate(start.getDate() + PERIOD_DAYS[periodType]);
  return toDateInput(start);
}

export default function RosterCreate() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [periodType, setPeriodType] = useState<RosterPeriodType>("Weekly");
  const [startDate, setStartDate] = useState(toDateInput(new Date()));
  const [endDate, setEndDate] = useState(suggestEndDate(toDateInput(new Date()), "Weekly"));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listDepartments().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  function handlePeriodTypeChange(next: RosterPeriodType) {
    setPeriodType(next);
    setEndDate(suggestEndDate(startDate, next));
  }

  function handleStartDateChange(next: string) {
    setStartDate(next);
    setEndDate(suggestEndDate(next, periodType));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const roster = await createRoster({
        departmentId: Number(departmentId),
        periodType,
        startDate,
        endDate,
      });
      navigate(`/rosters/${roster.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to create roster");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl space-y-5">
      <PageHeader title="New Roster" description="Pick a department and period to start building a roster." />
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}
        <Card title="Roster details">
          <div className="space-y-4">
            <Field label="Department" required>
              <Select required value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">Select a department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Period type" required>
              <Select
                value={periodType}
                onChange={(e) => handlePeriodTypeChange(e.target.value as RosterPeriodType)}
              >
                {ROSTER_PERIOD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start date" required>
                <Input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                />
              </Field>
              <Field label="End date" required>
                <Input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </Field>
            </div>
          </div>
        </Card>
        <Button type="submit" isLoading={submitting} disabled={!departmentId} className="w-full">
          Create Roster
        </Button>
      </form>
    </div>
  );
}
