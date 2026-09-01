import { useEffect, useState } from "react";
import { SchedulerSettingsDto, UpdateSchedulerSettingsInput } from "@hrm-plus/shared";
import { Button, Card, Checkbox, Spinner } from "@hrm-plus/ui";
import { getSchedulerSettings, updateSchedulerSettings } from "../../api/schedulerSettings";
import { apiErrorMessage } from "../../utils/apiError";

type BoolKey = keyof UpdateSchedulerSettingsInput;

const TOGGLES: { key: BoolKey; label: string; hint: string }[] = [
  {
    key: "blockOnApprovedLeave",
    label: "Hard-block on approved leave",
    hint: "A participant on approved leave cannot be booked. Recommended on.",
  },
  {
    key: "blockOnPendingLeave",
    label: "Hard-block on pending leave",
    hint: "Treat a pending (not yet approved) leave request as a blocker rather than a warning.",
  },
  {
    key: "blockOnMeetingOverlap",
    label: "Hard-block on overlapping meeting",
    hint: "A participant already in another confirmed meeting at that time cannot be double-booked.",
  },
  {
    key: "blockOnOutsideShift",
    label: "Hard-block outside shift hours",
    hint: "The meeting window must fall entirely inside each participant's rostered shift.",
  },
  {
    key: "blockOnNoRoster",
    label: "Hard-block when no roster assignment",
    hint: "A participant with no roster assignment for that day cannot be booked.",
  },
  {
    key: "considerApprovedRostersOnly",
    label: "Only consider approved rosters",
    hint: "Ignore draft/pending roster assignments when checking shift availability.",
  },
  {
    key: "optionalParticipantsCanBlock",
    label: "Optional participants can block",
    hint: "By default an optional participant's conflict is only ever a warning.",
  },
];

export default function SchedulerSettings() {
  const [settings, setSettings] = useState<SchedulerSettingsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSchedulerSettings()
      .then(setSettings)
      .catch((err) => setError(apiErrorMessage(err, "Failed to load scheduler settings")))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload: UpdateSchedulerSettingsInput = {};
      for (const t of TOGGLES) payload[t.key] = settings[t.key];
      const updated = await updateSchedulerSettings(payload);
      setSettings(updated);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to save scheduler settings"));
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

  if (!settings) {
    return <div className="text-sm text-red-700">{error ?? "Failed to load scheduler settings"}</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}
      {saved && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          Scheduler settings saved.
        </div>
      )}

      <Card
        title="Meeting conflict rules"
        description="Choose which conflicts hard-block a meeting confirmation. Everything else surfaces as a warning the organizer can override."
      >
        <div className="space-y-4">
          {TOGGLES.map((t) => (
            <label key={t.key} className="flex items-start gap-2 text-sm text-slate-700">
              <Checkbox
                checked={settings[t.key]}
                onChange={(e) => setSettings((s) => (s ? { ...s, [t.key]: e.target.checked } : s))}
              />
              <span>
                <span className="font-medium">{t.label}</span>
                <span className="block text-xs text-slate-400">{t.hint}</span>
              </span>
            </label>
          ))}

          <Button onClick={handleSave} isLoading={saving}>
            Save
          </Button>
        </div>
      </Card>
    </div>
  );
}
