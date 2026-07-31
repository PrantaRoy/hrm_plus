import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmployeeLeaveAllocationDto } from "@hrm-plus/shared";
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from "@hrm-plus/ui";
import { createLeaveRequest, listMyAllocations } from "../../api/leaveRequests";

export default function ApplyLeave() {
  const navigate = useNavigate();
  const [allocations, setAllocations] = useState<EmployeeLeaveAllocationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ leaveTypeId: "", startDate: "", endDate: "", reason: "" });

  useEffect(() => {
    listMyAllocations()
      .then(setAllocations)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load leave allocations"))
      .finally(() => setLoading(false));
  }, []);

  const selectedAllocation = allocations.find((a) => String(a.leaveTypeId) === form.leaveTypeId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.leaveTypeId) {
      setError("Select a leave type");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createLeaveRequest({
        leaveTypeId: Number(form.leaveTypeId),
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason || undefined,
      });
      navigate("/leave/my-requests");
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl space-y-5">
      <PageHeader title="Apply for Leave" description="Submit a leave request for approval." />

      <Card>
        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : allocations.length === 0 ? (
          <p className="text-sm text-slate-500">
            You have no leave types allocated yet. Contact HR to have leave types set up for you.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
            )}

            <Field label="Leave type" required>
              <Select
                value={form.leaveTypeId}
                onChange={(e) => setForm((f) => ({ ...f, leaveTypeId: e.target.value }))}
              >
                <option value="">Select…</option>
                {allocations.map((a) => (
                  <option key={a.id} value={a.leaveTypeId}>
                    {a.leaveTypeName} ({a.remainingDays} days remaining)
                  </option>
                ))}
              </Select>
              {selectedAllocation && (
                <p className="mt-1 text-xs text-slate-400">
                  {selectedAllocation.remainingDays} of {selectedAllocation.allocatedDays} days remaining for{" "}
                  {selectedAllocation.year}
                </p>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Start date" required>
                <Input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </Field>
              <Field label="End date" required>
                <Input
                  type="date"
                  required
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </Field>
            </div>

            <Field label="Reason" helperText="Optional">
              <Textarea
                rows={3}
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              />
            </Field>

            <Button type="submit" isLoading={submitting}>
              Submit Request
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
