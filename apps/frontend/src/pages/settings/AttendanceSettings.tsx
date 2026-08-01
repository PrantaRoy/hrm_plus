import { useEffect, useState } from "react";
import { Button, Card, Checkbox, Spinner } from "@hrm-plus/ui";
import { getAttendanceSettings, updateAttendanceSettings } from "../../api/attendance";

export default function AttendanceSettings() {
  const [pressAndHoldEnabled, setPressAndHoldEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getAttendanceSettings()
      .then((settings) => setPressAndHoldEnabled(settings.pressAndHoldEnabled))
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load attendance settings"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updateAttendanceSettings({ pressAndHoldEnabled });
      setPressAndHoldEnabled(updated.pressAndHoldEnabled);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to save attendance settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}
      {saved && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          Attendance settings saved.
        </div>
      )}

      <Card
        title="Attendance methods"
        description="Enable the check-in/check-out methods staff are allowed to use. Assign specific methods to individual staff from their Employee profile."
      >
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Checkbox checked={pressAndHoldEnabled} onChange={(e) => setPressAndHoldEnabled(e.target.checked)} />
            Press &amp; Hold — staff hold a button for 2 seconds to check in/out
          </label>

          <Button onClick={handleSave} isLoading={saving}>
            Save
          </Button>
        </div>
      </Card>
    </div>
  );
}
