import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AssetDto, DocumentRequestDto, EmployeeDto } from "@hrm-plus/shared";
import { Badge, Button, Card, EmptyState, PageHeader, Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@hrm-plus/ui";
import { listAssetsForEmployee, returnAsset, startOffboardingChecklist } from "../../api/assets";
import { approveDocumentRequest, getDocumentRequestDownloadUrl } from "../../api/documentRequests";
import { getEmployee } from "../../api/employees";
import { resolveFileUrl } from "../../utils/fileUrl";
import { ASSET_CATEGORY_LABELS } from "./categoryFields";

export default function OffboardingChecklist() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [employee, setEmployee] = useState<EmployeeDto | null>(null);
  const [assets, setAssets] = useState<AssetDto[]>([]);
  // Kept as page-local state only (not persisted/refetched) — this page is meant to be
  // used start-to-finish in one sitting: start the checklist, work through the returns,
  // then finalize it before navigating away.
  const [checklistRequest, setChecklistRequest] = useState<DocumentRequestDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);
  const [startingChecklist, setStartingChecklist] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  function refresh() {
    if (!employeeId) return;
    setLoading(true);
    Promise.all([getEmployee(Number(employeeId)), listAssetsForEmployee(Number(employeeId))])
      .then(([emp, assetList]) => {
        setEmployee(emp);
        setAssets(assetList);
      })
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load offboarding checklist"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [employeeId]);

  const allReturned = checklistRequest !== null && assets.length === 0;

  async function handleReturn(assetId: number) {
    setActingId(assetId);
    setError(null);
    try {
      await returnAsset(assetId);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to return asset");
    } finally {
      setActingId(null);
    }
  }

  async function handleStartChecklist() {
    if (!employeeId) return;
    setStartingChecklist(true);
    setError(null);
    try {
      const result = await startOffboardingChecklist(Number(employeeId));
      setChecklistRequest({ id: result.documentRequestId, status: "Pending" } as DocumentRequestDto);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to start return checklist");
    } finally {
      setStartingChecklist(false);
    }
  }

  async function handleFinalize() {
    if (!checklistRequest) return;
    setFinalizing(true);
    setError(null);
    try {
      const updated = await approveDocumentRequest(checklistRequest.id);
      setChecklistRequest(updated);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to finalize clearance certificate");
    } finally {
      setFinalizing(false);
    }
  }

  async function handleDownloadCertificate() {
    if (!checklistRequest) return;
    const url = await getDocumentRequestDownloadUrl(checklistRequest.id);
    window.open(resolveFileUrl(url) ?? url, "_blank");
  }

  if (loading) return <p className="text-slate-400">Loading...</p>;
  if (error && !employee) return <p className="text-red-600">{error}</p>;

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader
        title={employee ? `Asset Return — ${employee.firstName} ${employee.lastName}` : "Asset Return"}
        description="Start the return checklist, confirm every asset has been physically returned, then finalize the clearance certificate."
      />

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      {assets.length === 0 && !checklistRequest ? (
        <EmptyState
          title="Nothing currently assigned"
          description="This employee has no assets checked out — there's nothing to return."
        />
      ) : (
        <>
          {!checklistRequest && (
            <Card className="space-y-3">
              <p className="text-sm text-slate-600">
                Starting the checklist snapshots every asset currently assigned to this employee, so returns can be
                tracked and a clearance certificate generated once they're all back.
              </p>
              <Button isLoading={startingChecklist} onClick={handleStartChecklist}>
                Start Return Checklist
              </Button>
            </Card>
          )}

          <Card>
            {assets.length === 0 ? (
              <EmptyState title="All assets returned" description="Every checked-out asset has been marked as returned." />
            ) : (
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Tag</TableHeaderCell>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Category</TableHeaderCell>
                    <TableHeaderCell className="text-right">Action</TableHeaderCell>
                  </tr>
                </TableHead>
                <tbody>
                  {assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>{asset.assetTag}</TableCell>
                      <TableCell>{asset.name}</TableCell>
                      <TableCell>{ASSET_CATEGORY_LABELS[asset.category]}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          disabled={!checklistRequest}
                          isLoading={actingId === asset.id}
                          onClick={() => handleReturn(asset.id)}
                        >
                          Mark Returned
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          {checklistRequest && (
            <Card className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge color="brand">{checklistRequest.status}</Badge>
                {checklistRequest.status === "Issued" && (
                  <Button size="sm" onClick={handleDownloadCertificate}>
                    Download Clearance Certificate
                  </Button>
                )}
              </div>
              {checklistRequest.status === "Pending" && (
                <Button disabled={!allReturned} isLoading={finalizing} onClick={handleFinalize}>
                  {allReturned ? "Finalize & Issue Clearance Certificate" : "Return all assets first"}
                </Button>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
