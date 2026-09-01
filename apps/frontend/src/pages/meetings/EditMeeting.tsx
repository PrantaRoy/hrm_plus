import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AvailabilityReportDto, EmployeeDto, MeetingDto } from "@hrm-plus/shared";
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from "@hrm-plus/ui";
import { listEmployees } from "../../api/employees";
import { checkAvailability, getMeeting, updateMeeting } from "../../api/meetings";
import ConflictList from "./ConflictList";
import { reportFromConflicts } from "./report";
import { apiErrorConflicts, apiErrorMessage } from "../../utils/apiError";

interface Row {
  employeeId: number;
  isRequired: boolean;
}

// Meeting instants are stored from a wall-clock time in the tenant timezone
// (default UTC), so round-trip the edit form through UTC parts.
function toTimeInput(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export default function EditMeeting() {
  const { id } = useParams();
  const meetingId = Number(id);
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [meeting, setMeeting] = useState<MeetingDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState<AvailabilityReportDto | null>(null);
  const [checking, setChecking] = useState(false);

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

  useEffect(() => {
    listEmployees({ pageSize: 200 })
      .then((res) => setEmployees(res.items))
      .catch(() => undefined);
    getMeeting(meetingId)
      .then((m) => {
        setMeeting(m);
        setForm({
          title: m.title,
          description: m.description ?? "",
          locationText: m.locationText ?? "",
          date: m.date.slice(0, 10),
          startTime: toTimeInput(m.startAt),
          endTime: toTimeInput(m.endAt),
        });
        setRows(
          m.participants
            .filter((p) => p.employeeId !== m.organizerEmployeeId)
            .map((p) => ({ employeeId: p.employeeId, isRequired: p.isRequired }))
        );
      })
      .catch((err) => setError(apiErrorMessage(err, "Failed to load meeting")));
  }, [meetingId]);

  const nameById = useMemo(
    () => new Map(employees.map((e) => [e.id, `${e.firstName} ${e.lastName}`])),
    [employees]
  );

  const participants = rows.map((r) => ({ employeeId: r.employeeId, isRequired: r.isRequired }));

  async function runCheck() {
    setChecking(true);
    setError(null);
    try {
      setReport(
        await checkAvailability({
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          participants,
          excludeMeetingId: meetingId,
        })
      );
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to check availability"));
    } finally {
      setChecking(false);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateMeeting(meetingId, {
        title: form.title,
        description: form.description || null,
        locationText: form.locationText || null,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        participants,
      });
      navigate(`/meetings/${meetingId}`);
    } catch (err) {
      const conflicts = apiErrorConflicts(err);
      if (conflicts) setReport(reportFromConflicts(conflicts));
      setError(apiErrorMessage(err, "Failed to update meeting"));
    } finally {
      setSaving(false);
    }
  }

  function addParticipant() {
    const pid = Number(pickerId);
    if (!pid || rows.some((r) => r.employeeId === pid)) return;
    setRows((prev) => [...prev, { employeeId: pid, isRequired: true }]);
    setPickerId("");
  }

  if (!meeting) return <p className="text-sm text-slate-400">{error ?? "Loading…"}</p>;

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="Edit Meeting" description="Editing a confirmed meeting returns it to draft for re-confirmation." />
      <Card>
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
          )}

          <Field label="Title" required>
            <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </Field>
          <Field label="Description">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>
          <Field label="Location / link">
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

          <Field label="Participants" helperText="The organizer is always included.">
            <div className="flex gap-2">
              <Select value={pickerId} onChange={(e) => setPickerId(e.target.value)}>
                <option value="">Select an employee…</option>
                {employees
                  .filter((emp) => emp.id !== meeting.organizerEmployeeId && !rows.some((r) => r.employeeId === emp.id))
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

          <Button type="button" variant="secondary" onClick={runCheck} isLoading={checking}>
            Check availability
          </Button>
          {report && <ConflictList report={report} />}

          <div className="flex gap-2 pt-2">
            <Button type="submit" isLoading={saving}>
              Save changes
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(`/meetings/${meetingId}`)}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
