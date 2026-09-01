import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AvailabilityReportDto, EmployeeDto, MeetingParticipantInput } from "@hrm-plus/shared";
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from "@hrm-plus/ui";
import { listEmployees } from "../../api/employees";
import { checkAvailability, createMeeting } from "../../api/meetings";
import ConflictList from "./ConflictList";
import { reportFromConflicts } from "./report";
import { apiErrorConflicts, apiErrorMessage } from "../../utils/apiError";

interface Row {
  employeeId: number;
  isRequired: boolean;
}

export default function ScheduleMeeting() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    locationText: "",
    date: "",
    startTime: "",
    endTime: "",
  });
  const [rows, setRows] = useState<Row[]>([]);
  const [pickerId, setPickerId] = useState("");
  const [report, setReport] = useState<AvailabilityReportDto | null>(null);
  const [checking, setChecking] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    listEmployees({ pageSize: 200 })
      .then((res) => setEmployees(res.items))
      .catch((err) => setError(apiErrorMessage(err, "Failed to load employees")));
  }, []);

  const nameById = useMemo(
    () => new Map(employees.map((e) => [e.id, `${e.firstName} ${e.lastName}`])),
    [employees]
  );

  const canCheck =
    form.date !== "" && form.startTime !== "" && form.endTime !== "" && form.endTime > form.startTime;

  const participants: MeetingParticipantInput[] = rows.map((r) => ({
    employeeId: r.employeeId,
    isRequired: r.isRequired,
  }));

  // Reset the availability verdict whenever the inputs it was based on change.
  const inputsKey = JSON.stringify({ ...form, rows });
  const lastCheckedKey = useRef<string>("");
  useEffect(() => {
    if (inputsKey !== lastCheckedKey.current) {
      setReport(null);
      setAcknowledged(false);
    }
  }, [inputsKey]);

  function addParticipant() {
    const id = Number(pickerId);
    if (!id || rows.some((r) => r.employeeId === id)) return;
    setRows((prev) => [...prev, { employeeId: id, isRequired: true }]);
    setPickerId("");
  }

  async function runCheck() {
    if (!canCheck) return;
    setChecking(true);
    setError(null);
    try {
      const result = await checkAvailability({
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        participants,
      });
      setReport(result);
      lastCheckedKey.current = inputsKey;
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to check availability"));
    } finally {
      setChecking(false);
    }
  }

  async function handleSubmit(e: FormEvent, confirmNow: boolean) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const meeting = await createMeeting({
        title: form.title,
        description: form.description || undefined,
        locationText: form.locationText || undefined,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        participants,
        confirmNow,
        acknowledgeWarnings: acknowledged,
      });
      navigate(`/meetings/${meeting.id}`);
    } catch (err) {
      const conflicts = apiErrorConflicts(err);
      if (conflicts) setReport(reportFromConflicts(conflicts));
      setError(apiErrorMessage(err, "Failed to schedule meeting"));
    } finally {
      setSubmitting(false);
    }
  }

  const hasBlock = report?.conflicts.some((c) => c.severity === "BLOCK") ?? false;
  const hasWarnings = report?.hasWarnings ?? false;
  const confirmDisabled = submitting || !report || hasBlock || (hasWarnings && !acknowledged);

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader
        title="Schedule a Meeting"
        description="Check participant availability against rosters and leave before confirming."
      />

      <Card>
        <form className="space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
          )}

          <Field label="Title" required>
            <Input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </Field>

          <Field label="Description" helperText="Optional">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>

          <Field label="Location / link" helperText="Optional">
            <Input
              value={form.locationText}
              onChange={(e) => setForm((f) => ({ ...f, locationText: e.target.value }))}
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Date" required>
              <Input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </Field>
            <Field label="Start" required>
              <Input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              />
            </Field>
            <Field label="End" required>
              <Input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              />
            </Field>
          </div>

          <Field label="Participants" helperText="The organizer (you) is always included as required.">
            <div className="flex gap-2">
              <Select value={pickerId} onChange={(e) => setPickerId(e.target.value)}>
                <option value="">Select an employee…</option>
                {employees
                  .filter((emp) => !rows.some((r) => r.employeeId === emp.id))
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
              </Select>
              <Button type="button" variant="secondary" onClick={addParticipant}>
                Add
              </Button>
            </div>
            {rows.length > 0 && (
              <ul className="mt-2 space-y-1">
                {rows.map((r) => (
                  <li key={r.employeeId} className="flex items-center gap-3 text-sm text-slate-700">
                    <span className="flex-1">{nameById.get(r.employeeId) ?? `#${r.employeeId}`}</span>
                    <label className="flex items-center gap-1 text-xs text-slate-500">
                      <input
                        type="checkbox"
                        checked={r.isRequired}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((x) =>
                              x.employeeId === r.employeeId ? { ...x, isRequired: e.target.checked } : x
                            )
                          )
                        }
                      />
                      Required
                    </label>
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => setRows((prev) => prev.filter((x) => x.employeeId !== r.employeeId))}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Field>

          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={runCheck} isLoading={checking} disabled={!canCheck}>
              Check availability
            </Button>
            {!canCheck && <span className="text-xs text-slate-400">Fill in date and a valid time range first.</span>}
          </div>

          {report && (
            <div className="space-y-2">
              <ConflictList report={report} />
              {hasWarnings && !hasBlock && (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                  />
                  I acknowledge these warnings and want to confirm anyway
                </label>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={(e) => handleSubmit(e, false)} isLoading={submitting}>
              Save as draft
            </Button>
            <Button type="button" onClick={(e) => handleSubmit(e, true)} disabled={confirmDisabled}>
              Confirm meeting
            </Button>
          </div>
          {!report && (
            <p className="text-xs text-slate-400">Run an availability check to enable confirmation.</p>
          )}
        </form>
      </Card>
    </div>
  );
}
