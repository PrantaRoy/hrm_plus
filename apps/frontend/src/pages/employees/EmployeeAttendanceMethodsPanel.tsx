import { useEffect, useState } from "react";
import { ATTENDANCE_METHODS, AttendanceMethod } from "@hrm-plus/shared";
import { Button, Card, Checkbox, Spinner } from "@hrm-plus/ui";
import { getAttendanceSettings, getEmployeeAttendanceMethods, setEmployeeAttendanceMethods } from "../../api/attendance";

const METHOD_LABELS: Record<AttendanceMethod, string> = {
  PressAndHold: "Press & Hold",
  QrCode: "QR Code",
};

export function EmployeeAttendanceMethodsPanel({ employeeId }: { employeeId: number }) {
  const [enabledTenantWide, setEnabledTenantWide] = useState<AttendanceMethod[]>([]);
  const [selected, setSelected] = useState<AttendanceMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([getAttendanceSettings(), getEmployeeAttendanceMethods(employeeId)])
      .then(([settings, employeeMethods]) => {
        const tenantWide: AttendanceMethod[] = [];
        if (settings.pressAndHoldEnabled) tenantWide.push("PressAndHold");
        if (settings.qrCodeEnabled) tenantWide.push("QrCode");
        setEnabledTenantWide(tenantWide);
        setSelected(employeeMethods.methods);
      })
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load attendance methods"))
      .finally(() => setLoading(false));
  }, [employeeId]);

  function toggle(method: AttendanceMethod, checked: boolean) {
    setSelected((prev) => (checked ? [...prev, method] : prev.filter((m) => m !== method)));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const result = await setEmployeeAttendanceMethods(employeeId, { methods: selected });
      setSelected(result.methods);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to save attendance methods");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Attendance methods" description="Check-in/check-out methods this staff member is allowed to use.">
      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
          )}
          {saved && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
              Attendance methods saved.
            </div>
          )}

          {ATTENDANCE_METHODS.map((method) => {
            const enabled = enabledTenantWide.includes(method);
            return (
              <label
                key={method}
                className="flex items-center gap-2 text-sm text-slate-700"
                title={enabled ? undefined : "Enable this method tenant-wide in Settings → Attendance first"}
              >
                <Checkbox
                  checked={selected.includes(method)}
                  disabled={!enabled}
                  onChange={(e) => toggle(method, e.target.checked)}
                />
                {METHOD_LABELS[method]}
                {!enabled && <span className="text-xs text-slate-400">(disabled tenant-wide)</span>}
              </label>
            );
          })}

          <Button size="sm" onClick={handleSave} isLoading={saving}>
            Save
          </Button>
        </div>
      )}
    </Card>
  );
}
