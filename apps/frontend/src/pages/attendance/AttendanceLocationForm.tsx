import { FormEvent, useState } from "react";
import { CreateAttendanceLocationInput } from "@hrm-plus/shared";
import { Button, Card, Field, Input, Select } from "@hrm-plus/ui";

export type AttendanceLocationFormValues = {
  name: string;
  latitude: string;
  longitude: string;
  radiusMeters: string;
  status: "Active" | "Inactive";
};

export const emptyAttendanceLocationForm: AttendanceLocationFormValues = {
  name: "",
  latitude: "",
  longitude: "",
  radiusMeters: "100",
  status: "Active",
};

interface AttendanceLocationFormProps {
  initialValues?: AttendanceLocationFormValues;
  submitLabel: string;
  onSubmit: (input: CreateAttendanceLocationInput) => Promise<void>;
}

export function AttendanceLocationForm({ initialValues, submitLabel, onSubmit }: AttendanceLocationFormProps) {
  const [form, setForm] = useState<AttendanceLocationFormValues>(initialValues ?? emptyAttendanceLocationForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  function set<K extends keyof AttendanceLocationFormValues>(key: K, value: AttendanceLocationFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        set("latitude", String(position.coords.latitude));
        set("longitude", String(position.coords.longitude));
        setLocating(false);
      },
      (geoError) => {
        setError(geoError.message || "Could not get your current location");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        radiusMeters: Number(form.radiusMeters) || 0,
        status: form.status,
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to save location");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}

      <Card title="Location details">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" required>
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
            <Field label="Latitude" required>
              <Input
                required
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => set("latitude", e.target.value)}
              />
            </Field>
            <Field label="Longitude" required>
              <Input
                required
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => set("longitude", e.target.value)}
              />
            </Field>
          </div>
          <Button type="button" variant="secondary" size="sm" isLoading={locating} onClick={useCurrentLocation}>
            Use my current location
          </Button>
          <Field label="Radius (meters)" required helperText="e.g. 50, 100, 300">
            <Input
              required
              type="number"
              min={1}
              value={form.radiusMeters}
              onChange={(e) => set("radiusMeters", e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Button type="submit" isLoading={submitting} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
