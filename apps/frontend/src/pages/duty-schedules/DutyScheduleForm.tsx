import { FormEvent, useState } from "react";
import { CreateDutyScheduleInput } from "@hrm-plus/shared";
import { Button, Card, Checkbox, Field, Input, Select } from "@hrm-plus/ui";

export type DutyScheduleFormValues = {
  name: string;
  startTime: string;
  endTime: string;
  checkinConsiderMinutes: string;
  checkoutConsiderMinutes: string;
  maxOverTimeMinutes: string;
  earlyCheckinBufferMinutes: string;
  isTardyApplicable: boolean;
  status: "Active" | "Inactive";
  shortDescription: string;
};

export const emptyDutyScheduleForm: DutyScheduleFormValues = {
  name: "",
  startTime: "09:00",
  endTime: "17:00",
  checkinConsiderMinutes: "0",
  checkoutConsiderMinutes: "0",
  maxOverTimeMinutes: "0",
  earlyCheckinBufferMinutes: "0",
  isTardyApplicable: true,
  status: "Active",
  shortDescription: "",
};

interface DutyScheduleFormProps {
  initialValues?: DutyScheduleFormValues;
  submitLabel: string;
  onSubmit: (input: CreateDutyScheduleInput) => Promise<void>;
}

export function DutyScheduleForm({ initialValues, submitLabel, onSubmit }: DutyScheduleFormProps) {
  const [form, setForm] = useState<DutyScheduleFormValues>(initialValues ?? emptyDutyScheduleForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof DutyScheduleFormValues>(key: K, value: DutyScheduleFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name,
        startTime: form.startTime,
        endTime: form.endTime,
        checkinConsiderMinutes: Number(form.checkinConsiderMinutes) || 0,
        checkoutConsiderMinutes: Number(form.checkoutConsiderMinutes) || 0,
        maxOverTimeMinutes: Number(form.maxOverTimeMinutes) || 0,
        earlyCheckinBufferMinutes: Number(form.earlyCheckinBufferMinutes) || 0,
        isTardyApplicable: form.isTardyApplicable,
        status: form.status,
        shortDescription: form.shortDescription || null,
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to save duty schedule");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}

      <Card title="Duty schedule details">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Shift name" required>
              <Input required value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => set("status", e.target.value as "Active" | "Inactive")}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start time" required>
              <Input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => set("startTime", e.target.value)}
              />
            </Field>
            <Field label="End time" required>
              <Input type="time" required value={form.endTime} onChange={(e) => set("endTime", e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Checkin consider (minutes)" helperText="Grace period before shift start">
              <Input
                type="number"
                min={0}
                value={form.checkinConsiderMinutes}
                onChange={(e) => set("checkinConsiderMinutes", e.target.value)}
              />
            </Field>
            <Field label="Checkout consider (minutes)" helperText="Grace period after shift end">
              <Input
                type="number"
                min={0}
                value={form.checkoutConsiderMinutes}
                onChange={(e) => set("checkoutConsiderMinutes", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Max over time (minutes)">
              <Input
                type="number"
                min={0}
                value={form.maxOverTimeMinutes}
                onChange={(e) => set("maxOverTimeMinutes", e.target.value)}
              />
            </Field>
            <Field label="Early check-in buffer (minutes)">
              <Input
                type="number"
                min={0}
                value={form.earlyCheckinBufferMinutes}
                onChange={(e) => set("earlyCheckinBufferMinutes", e.target.value)}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Checkbox
              checked={form.isTardyApplicable}
              onChange={(e) => set("isTardyApplicable", e.target.checked)}
            />
            Is tardy applicable
          </label>
          <Field label="Short description">
            <Input value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Button type="submit" isLoading={submitting} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
