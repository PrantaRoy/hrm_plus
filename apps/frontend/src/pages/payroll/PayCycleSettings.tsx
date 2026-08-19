import { useEffect, useState } from "react";
import { PAY_CYCLE_FREQUENCIES, PayCycleDto } from "@hrm-plus/shared";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Select,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import { createPayCycle, listPayCycles, updatePayCycle } from "../../api/payroll";

export default function PayCycleSettings() {
  const [payCycles, setPayCycles] = useState<PayCycleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<(typeof PAY_CYCLE_FREQUENCIES)[number]>("FORTNIGHTLY");
  const [submitting, setSubmitting] = useState(false);

  function refresh() {
    setLoading(true);
    listPayCycles()
      .then(setPayCycles)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load pay cycles"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleCreate() {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createPayCycle({ name: name.trim(), frequency });
      setName("");
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to create pay cycle");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(payCycle: PayCycleDto) {
    try {
      await updatePayCycle(payCycle.id, { status: payCycle.status === "Active" ? "Inactive" : "Active" });
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to update pay cycle");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Pay Cycles" description="Define the pay-frequency groups employees are assigned to." />

      <Card>
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}
        <div className="flex items-end gap-3 mb-5">
          <Field label="Name" className="w-64">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard Fortnightly" />
          </Field>
          <Field label="Frequency" className="w-48">
            <Select value={frequency} onChange={(e) => setFrequency(e.target.value as typeof frequency)}>
              {PAY_CYCLE_FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
          </Field>
          <Button onClick={handleCreate} isLoading={submitting}>
            Add Pay Cycle
          </Button>
        </div>

        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Frequency</TableHeaderCell>
              <TableHeaderCell>Employees</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-400 py-6">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading && payCycles.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-400 py-6">
                  No pay cycles yet.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              payCycles.map((pc) => (
                <TableRow key={pc.id}>
                  <TableCell className="font-medium text-slate-900">{pc.name}</TableCell>
                  <TableCell>
                    <Badge>{pc.frequency}</Badge>
                  </TableCell>
                  <TableCell>{pc.employeeCount}</TableCell>
                  <TableCell>
                    <StatusPill status={pc.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="secondary" onClick={() => toggleStatus(pc)}>
                      {pc.status === "Active" ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
