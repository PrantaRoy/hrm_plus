import { useEffect, useState } from "react";
import { PAYROLL_REGIONS, PayrollRegion } from "@hrm-plus/shared";
import { Button, Card, Field, Input, PageHeader, Select } from "@hrm-plus/ui";
import { getPayrollSettings, updatePayrollSettings } from "../../api/payroll";

export default function PayrollSettingsPage() {
  const [overtimeMultiplier, setOvertimeMultiplier] = useState("1.5");
  const [region, setRegion] = useState<PayrollRegion>("NZ");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getPayrollSettings()
      .then((s) => {
        setOvertimeMultiplier(String(s.overtimeMultiplier));
        setRegion(s.region);
      })
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load payroll settings"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updatePayrollSettings({ overtimeMultiplier: Number(overtimeMultiplier), region });
      setSaved(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to save payroll settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-slate-400 py-10 text-center">Loading...</div>;

  return (
    <div className="space-y-5">
      <PageHeader title="Payroll Settings" description="Overtime multiplier and region drive statutory tax and bank-export format." />

      <Card className="max-w-md">
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}
        {saved && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
            Saved.
          </div>
        )}

        <Field label="Overtime multiplier" className="mb-4">
          <Input type="number" min={1} max={5} step="0.1" value={overtimeMultiplier} onChange={(e) => setOvertimeMultiplier(e.target.value)} />
        </Field>

        <Field label="Region" className="mb-5">
          <Select value={region} onChange={(e) => setRegion(e.target.value as PayrollRegion)}>
            {PAYROLL_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>

        <Button onClick={handleSave} isLoading={saving}>
          Save
        </Button>
      </Card>
    </div>
  );
}
