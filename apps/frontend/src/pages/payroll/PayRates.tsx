import { useEffect, useState } from "react";
import { EmployeeDto, PAY_RATE_TYPES, EmployeePayRateDto } from "@hrm-plus/shared";
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Select,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import { listEmployees } from "../../api/employees";
import { createPayRate, listPayRatesForEmployee } from "../../api/payroll";

export default function PayRates() {
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [rates, setRates] = useState<EmployeePayRateDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [rateType, setRateType] = useState<(typeof PAY_RATE_TYPES)[number]>("HOURLY");
  const [baseRate, setBaseRate] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");

  useEffect(() => {
    listEmployees({ pageSize: 100 }).then((res) => {
      setEmployees(res.items);
      if (res.items.length > 0) setEmployeeId(res.items[0].id);
    });
  }, []);

  function refresh(id: number) {
    setLoading(true);
    listPayRatesForEmployee(id)
      .then(setRates)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load pay rates"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (employeeId !== null) refresh(employeeId);
  }, [employeeId]);

  async function handleCreate() {
    if (employeeId === null || !baseRate || !effectiveFrom) return;
    setSubmitting(true);
    setError(null);
    try {
      await createPayRate({
        employeeId,
        rateType,
        baseRate: Number(baseRate),
        effectiveFrom,
        effectiveTo: effectiveTo || undefined,
      });
      setBaseRate("");
      setEffectiveFrom("");
      setEffectiveTo("");
      refresh(employeeId);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to add pay rate");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Employee Pay Rates" description="Effective-dated hourly or salary rates used by the payroll engine." />

      <Card>
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}

        <Field label="Employee" className="w-72 mb-5">
          <Select value={employeeId ?? ""} onChange={(e) => setEmployeeId(Number(e.target.value))}>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName} ({e.employeeCode})
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex items-end gap-3 mb-5 flex-wrap">
          <Field label="Rate type" className="w-36">
            <Select value={rateType} onChange={(e) => setRateType(e.target.value as typeof rateType)}>
              {PAY_RATE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Base rate" className="w-32">
            <Input type="number" min={0} step="0.01" value={baseRate} onChange={(e) => setBaseRate(e.target.value)} />
          </Field>
          <Field label="Effective from" className="w-44">
            <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
          </Field>
          <Field label="Effective to (optional)" className="w-44">
            <Input type="date" value={effectiveTo} onChange={(e) => setEffectiveTo(e.target.value)} />
          </Field>
          <Button onClick={handleCreate} isLoading={submitting}>
            Add Rate
          </Button>
        </div>

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
                  No pay rates recorded for this employee.
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
      </Card>
    </div>
  );
}
