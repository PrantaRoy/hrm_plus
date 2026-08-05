import { Fragment, useEffect, useState } from "react";
import { DocumentRequestDto } from "@hrm-plus/shared";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Textarea,
} from "@hrm-plus/ui";
import {
  approveDocumentRequest,
  listPendingMyApproval,
  rejectDocumentRequest,
  updateDocumentRequestFieldValues,
} from "../../api/documentRequests";
import { resolveFileUrl } from "../../utils/fileUrl";

const PAYSLIP_FIELDS: { key: string; label: string }[] = [
  { key: "basicSalary", label: "Basic salary" },
  { key: "allowances", label: "Allowances" },
  { key: "deductions", label: "Deductions" },
  { key: "netPay", label: "Net pay" },
];

function PayslipFieldsForm({
  request,
  onSaved,
}: {
  request: DocumentRequestDto;
  onSaved: (updated: DocumentRequestDto) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(PAYSLIP_FIELDS.map((f) => [f.key, String(request.fieldValues?.[f.key] ?? "")]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateDocumentRequestFieldValues(
        request.id,
        Object.fromEntries(PAYSLIP_FIELDS.map((f) => [f.key, Number(values[f.key]) || 0]))
      );
      onSaved(updated);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to save payslip figures");
    } finally {
      setSaving(false);
    }
  }

  const allFilled = PAYSLIP_FIELDS.every((f) => values[f.key] !== "" && !Number.isNaN(Number(values[f.key])));

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
        Payslip figures (required before this request can be approved)
      </p>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        {PAYSLIP_FIELDS.map((f) => (
          <Field key={f.key} label={f.label}>
            <Input
              type="number"
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          </Field>
        ))}
      </div>
      <Button type="button" size="sm" onClick={handleSave} isLoading={saving}>
        Save Figures
      </Button>
      {!allFilled && <p className="text-xs text-amber-700">All four figures must be filled before approving.</p>}
    </div>
  );
}

export default function DocumentApprovals() {
  const [requests, setRequests] = useState<DocumentRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, string>>({});

  function refresh() {
    setLoading(true);
    listPendingMyApproval()
      .then(setRequests)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load pending approvals"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  function isPayslipReady(request: DocumentRequestDto): boolean {
    if (request.categoryCode !== "PAYSLIP") return true;
    return PAYSLIP_FIELDS.every((f) => {
      const v = request.fieldValues?.[f.key];
      return typeof v === "number" && !Number.isNaN(v);
    });
  }

  function handleFieldValuesSaved(updated: DocumentRequestDto) {
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  async function handleDecision(id: number, decision: "approve" | "reject") {
    setActingId(id);
    setError(null);
    try {
      const comment = comments[id] || undefined;
      if (decision === "approve") {
        await approveDocumentRequest(id, { comment });
      } else {
        await rejectDocumentRequest(id, { comment });
      }
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to record decision");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Document Approvals" description="Requests currently waiting on your decision." />

      <Card>
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Employee</TableHeaderCell>
              <TableHeaderCell>Document</TableHeaderCell>
              <TableHeaderCell>Priority</TableHeaderCell>
              <TableHeaderCell>Step</TableHeaderCell>
              <TableHeaderCell>Comment</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-6">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading && requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-6">
                  Nothing is waiting on your approval.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              requests.map((request) => {
                const currentStep = request.approvals.find((a) => a.stepOrder === request.currentStepOrder);
                const payslipReady = isPayslipReady(request);
                return (
                  <Fragment key={request.id}>
                    <TableRow>
                      <TableCell>{request.employeeName}</TableCell>
                      <TableCell>
                        {request.templateName}
                        <div className="text-xs text-slate-400">{request.categoryName}</div>
                        {request.reason && <div className="text-xs text-slate-500 mt-0.5">Reason: {request.reason}</div>}
                        {request.attachmentFileUrl && (
                          <a
                            href={resolveFileUrl(request.attachmentFileUrl) ?? "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-brand-600 hover:underline"
                          >
                            View attachment
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge color={request.priority === "Urgent" || request.priority === "High" ? "red" : "slate"}>
                          {request.priority}
                        </Badge>
                        {request.deadlineDate && (
                          <div className="text-xs text-slate-400 mt-0.5">By {request.deadlineDate.slice(0, 10)}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {currentStep?.stepOrder}.{" "}
                        {currentStep?.approverType === "ReportingManager" ? "Reporting Manager" : currentStep?.roleName}
                        <div>
                          <StatusPill status={request.status} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Textarea
                          rows={1}
                          placeholder="Optional comment"
                          value={comments[request.id] ?? ""}
                          onChange={(e) => setComments((c) => ({ ...c, [request.id]: e.target.value }))}
                          className="min-w-[160px]"
                        />
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          className="mr-2"
                          isLoading={actingId === request.id}
                          disabled={!payslipReady}
                          onClick={() => handleDecision(request.id, "approve")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          isLoading={actingId === request.id}
                          onClick={() => handleDecision(request.id, "reject")}
                        >
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                    {request.categoryCode === "PAYSLIP" && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-slate-50">
                          <PayslipFieldsForm request={request} onSaved={handleFieldValuesSaved} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
