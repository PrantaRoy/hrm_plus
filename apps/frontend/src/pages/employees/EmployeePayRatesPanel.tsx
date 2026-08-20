import { FormEvent, useEffect, useState } from "react";
import { EmployeePayRateDto, PAY_RATE_TYPES } from "@hrm-plus/shared";
import { Button, Card, Field, Input, Select, Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@hrm-plus/ui";
import { createPayRate, listPayRatesForEmployee } from "../../api/payroll";

interface RateForm {
  rateType: (typeof PAY_RATE_TYPES)[number];
  baseRate: string;
  effectiveFrom: string;
  effectiveTo: string;
}

function emptyForm(): RateForm {
  return { rateType: "HOURLY", baseRate: "", effectiveFrom: "", effectiveTo: "" };
}

export function EmployeePayRatesPanel({ employeeId }: { employeeId: number }) {
  const [rates, setRates] = useState<EmployeePayRateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<RateForm>(emptyForm());
  const [submitting, setSubmitting] = useState(false);

  function refresh() {
    setLoading(true);
    listPayRatesForEmployee(employeeId)
      .then(setRates)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load pay rates"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [employeeId]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!form.baseRate || !form.effectiveFrom) {
      setError("Base rate and effective-from date are required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createPayRate({
        employeeId,
        rateType: form.rateType,
        baseRate: Number(form.baseRate),
        effectiveFrom: form.effectiveFrom,
        effectiveTo: form.effectiveTo || undefined,
      });
      setForm(emptyForm());
      setAdding(false);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to add pay rate");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card
      title="Pay Rates"
      description="Effective-dated hourly or salary rates used by the payroll engine."
      actions={
        !adding && (
          <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
            Add Rate
          </Button>
        )
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}

        {adding && (
          <form onSubmit={handleAdd} className="space-y-3 border border-slate-200 rounded-md p-4">
            <div className="grid grid-cols-4 gap-3">
              <Field label="Rate type" required>
                <Select value={form.rateType} onChange={(e) => setForm((f) => ({ ...f, rateType: e.target.value as RateForm["rateType"] }))}>
                  {PAY_RATE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Base rate" required>
                <Input type="number" min={0} step="0.01" value={form.baseRate} onChange={(e) => setForm((f) => ({ ...f, baseRate: e.target.value }))} />
              </Field>
              <Field label="Effective from" required>
                <Input type="date" value={form.effectiveFrom} onChange={(e) => setForm((f) => ({ ...f, effectiveFrom: e.target.value }))} />
              </Field>
              <Field label="Effective to (optional)">
                <Input type="date" value={form.effectiveTo} onChange={(e) => setForm((f) => ({ ...f, effectiveTo: e.target.value }))} />
              </Field>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" isLoading={submitting}>
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  setAdding(false);
                  setForm(emptyForm());
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Base rate</TableHeaderCell>
              <TableHeaderCell>Effective from</TableHeaderCell>
              <TableHeaderCell>Effective to</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {loading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-slate-400 py-6">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading && rates.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-slate-400 py-6">
                  No pay rates recorded yet.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              rates.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.rateType}</TableCell>
                  <TableCell>{r.baseRate.toFixed(2)}</TableCell>
                  <TableCell>{r.effectiveFrom.slice(0, 10)}</TableCell>
                  <TableCell>{r.effectiveTo ? r.effectiveTo.slice(0, 10) : "Ongoing"}</TableCell>
                </TableRow>
              ))}
          </tbody>
        </Table>
      </div>
    </Card>
  );
}
