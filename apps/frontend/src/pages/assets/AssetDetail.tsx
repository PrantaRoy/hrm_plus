import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AssetStatus, DocumentRequestDto, EmployeeDto } from "@hrm-plus/shared";
import {
  Badge,
  BadgeColor,
  Button,
  Card,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusPill,
  Textarea,
} from "@hrm-plus/ui";
import { assignAsset, getAsset, retireAsset, returnAsset } from "../../api/assets";
import { getDocumentRequest, getDocumentRequestDownloadUrl } from "../../api/documentRequests";
import { listEmployees } from "../../api/employees";
import { resolveFileUrl } from "../../utils/fileUrl";
import { useAuth } from "../../auth/AuthContext";
import { ASSET_CATEGORY_LABELS } from "./categoryFields";
import type { AssetDto } from "@hrm-plus/shared";

const statusColor: Record<AssetStatus, BadgeColor> = {
  Available: "green",
  Assigned: "brand",
  InRepair: "amber",
  Retired: "slate",
  Disposed: "red",
};

function ExpiryRow({ label, date }: { label: string; date: string | null }) {
  if (!date) return null;
  const soon = (new Date(date).getTime() - Date.now()) / (24 * 60 * 60 * 1000) <= 30;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={soon ? "font-medium text-amber-700" : "text-slate-700"}>{date}</span>
    </div>
  );
}

function DocumentRequestLink({ requestId }: { requestId: number }) {
  const [request, setRequest] = useState<DocumentRequestDto | null>(null);

  useEffect(() => {
    getDocumentRequest(requestId).then(setRequest).catch(() => setRequest(null));
  }, [requestId]);

  if (!request) return null;

  async function handleDownload() {
    const url = await getDocumentRequestDownloadUrl(requestId);
    window.open(resolveFileUrl(url) ?? url, "_blank");
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-500">{request.templateName}:</span>
      <StatusPill status={request.status} />
      {request.status === "Issued" && (
        <Button size="sm" variant="secondary" onClick={handleDownload}>
          Download
        </Button>
      )}
    </div>
  );
}

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdminOrHr = user?.role === "Admin" || user?.role === "HR";

  const [asset, setAsset] = useState<AssetDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [conditionOnAssign, setConditionOnAssign] = useState("");
  const [conditionOnReturn, setConditionOnReturn] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function refresh() {
    if (!id) return;
    setLoading(true);
    getAsset(Number(id))
      .then(setAsset)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load asset"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [id]);

  useEffect(() => {
    if (assignOpen) {
      listEmployees({ pageSize: 200 })
        .then((res) => setEmployees(res.items))
        .catch(() => setEmployees([]));
    }
  }, [assignOpen]);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!asset) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await assignAsset(asset.id, {
        employeeId: Number(employeeId),
        expectedReturnDate: expectedReturnDate || undefined,
        conditionOnAssign: conditionOnAssign || undefined,
      });
      setAssignOpen(false);
      setEmployeeId("");
      setExpectedReturnDate("");
      setConditionOnAssign("");
      refresh();
    } catch (err: any) {
      setActionError(err.response?.data?.error?.message ?? "Failed to assign asset");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReturn(e: React.FormEvent) {
    e.preventDefault();
    if (!asset) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await returnAsset(asset.id, { conditionOnReturn: conditionOnReturn || undefined });
      setReturnOpen(false);
      setConditionOnReturn("");
      refresh();
    } catch (err: any) {
      setActionError(err.response?.data?.error?.message ?? "Failed to return asset");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRetire() {
    if (!asset) return;
    if (!window.confirm("Retire this asset? It will no longer be assignable.")) return;
    setError(null);
    try {
      await retireAsset(asset.id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to retire asset");
    }
  }

  if (loading) return <p className="text-slate-400">Loading...</p>;
  if (error || !asset) return <p className="text-red-600">{error ?? "Asset not found"}</p>;

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader
        title={`${asset.name} (${asset.assetTag})`}
        description={ASSET_CATEGORY_LABELS[asset.category]}
        actions={
          isAdminOrHr ? (
            <div className="flex gap-2">
              {asset.status === "Available" && <Button onClick={() => setAssignOpen(true)}>Assign</Button>}
              {asset.status === "Assigned" && (
                <Button variant="secondary" onClick={() => setReturnOpen(true)}>
                  Return
                </Button>
              )}
              {asset.status !== "Retired" && asset.status !== "Disposed" && asset.status !== "Assigned" && (
                <Button variant="danger" onClick={handleRetire}>
                  Retire
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge color={statusColor[asset.status]}>{asset.status}</Badge>
          {asset.isFbtRelevant && <Badge color="amber">FBT-relevant</Badge>}
        </div>

        {asset.currentAssignment && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
            <p className="text-sm font-medium text-slate-700">
              Assigned to{" "}
              <Link to={`/employees/${asset.currentAssignment.employeeId}`} className="text-brand-600 hover:underline">
                {asset.currentAssignment.employeeName}
              </Link>
            </p>
            <p className="text-xs text-slate-500">
              Since {new Date(asset.currentAssignment.assignedAt).toLocaleDateString()} by{" "}
              {asset.currentAssignment.assignedByName}
              {asset.currentAssignment.expectedReturnDate &&
                ` — expected back ${new Date(asset.currentAssignment.expectedReturnDate).toLocaleDateString()}`}
            </p>
            {asset.currentAssignment.assignReceiptRequestId && (
              <DocumentRequestLink requestId={asset.currentAssignment.assignReceiptRequestId} />
            )}
          </div>
        )}

        <div className="space-y-1">
          <ExpiryRow label="Registration (AU rego) expiry" date={asset.registrationExpiry} />
          <ExpiryRow label="WoF/CoF expiry" date={asset.wofCofExpiry} />
          <ExpiryRow label="Test & tag expiry" date={asset.testAndTagExpiry} />
          <ExpiryRow label="Warranty expiry" date={asset.warrantyExpiry} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          {asset.serialNumber && (
            <div>
              <span className="text-slate-500">Serial: </span>
              {asset.serialNumber}
            </div>
          )}
          {asset.supplier && (
            <div>
              <span className="text-slate-500">Supplier: </span>
              {asset.supplier}
            </div>
          )}
          {asset.make && (
            <div>
              <span className="text-slate-500">Make/Model: </span>
              {asset.make} {asset.model}
            </div>
          )}
          {asset.registrationNumber && (
            <div>
              <span className="text-slate-500">Rego: </span>
              {asset.registrationNumber}
            </div>
          )}
        </div>

        {asset.notes && <p className="text-sm text-slate-600 whitespace-pre-wrap">{asset.notes}</p>}
        {asset.fbtNotes && <p className="text-sm text-amber-700 whitespace-pre-wrap">FBT notes: {asset.fbtNotes}</p>}

        {isAdminOrHr && (
          <Button variant="secondary" onClick={() => navigate(`/assets/${asset.id}/edit`)}>
            Edit
          </Button>
        )}
      </Card>

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Asset">
        <form onSubmit={handleAssign} className="space-y-3">
          {actionError && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{actionError}</div>}
          <Field label="Employee" required>
            <Select required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">Select employee…</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Expected return date">
            <Input type="date" value={expectedReturnDate} onChange={(e) => setExpectedReturnDate(e.target.value)} />
          </Field>
          <Field label="Condition on assign">
            <Textarea rows={2} value={conditionOnAssign} onChange={(e) => setConditionOnAssign(e.target.value)} />
          </Field>
          <Button type="submit" isLoading={submitting}>
            Assign
          </Button>
        </form>
      </Modal>

      <Modal open={returnOpen} onClose={() => setReturnOpen(false)} title="Return Asset">
        <form onSubmit={handleReturn} className="space-y-3">
          {actionError && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{actionError}</div>}
          <Field label="Condition on return">
            <Textarea rows={2} value={conditionOnReturn} onChange={(e) => setConditionOnReturn(e.target.value)} />
          </Field>
          <Button type="submit" isLoading={submitting}>
            Confirm Return
          </Button>
        </form>
      </Modal>
    </div>
  );
}
