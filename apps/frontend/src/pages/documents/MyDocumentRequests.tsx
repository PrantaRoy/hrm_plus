import { Fragment, useEffect, useState } from "react";
import { DocumentRequestDto } from "@hrm-plus/shared";
import { Button, Card, PageHeader, StatusPill, Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@hrm-plus/ui";
import {
  cancelDocumentRequest,
  fetchDocumentRequestPreview,
  getDocumentRequestDownloadUrl,
  listMyDocumentRequests,
} from "../../api/documentRequests";
import { resolveFileUrl } from "../../utils/fileUrl";

export default function MyDocumentRequests() {
  const [requests, setRequests] = useState<DocumentRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  function refresh() {
    setLoading(true);
    listMyDocumentRequests()
      .then(setRequests)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load document requests"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleCancel(id: number) {
    if (!window.confirm("Cancel this document request?")) return;
    setError(null);
    try {
      await cancelDocumentRequest(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to cancel document request");
    }
  }

  async function handlePreview(id: number) {
    setActingId(id);
    setError(null);
    try {
      const blob = await fetchDocumentRequestPreview(id);
      window.open(URL.createObjectURL(blob), "_blank");
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to load preview");
    } finally {
      setActingId(null);
    }
  }

  async function handleDownload(id: number) {
    setActingId(id);
    setError(null);
    try {
      const url = await getDocumentRequestDownloadUrl(id);
      window.open(resolveFileUrl(url) ?? url, "_blank");
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to download document");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="My Document Requests" description="Track the status of documents you've requested." />

      <Card>
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Document</TableHeaderCell>
              <TableHeaderCell>Priority</TableHeaderCell>
              <TableHeaderCell>Reference</TableHeaderCell>
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
            {!loading && requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-400 py-6">
                  You haven't requested any documents yet.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              requests.map((request) => (
                <Fragment key={request.id}>
                  <TableRow>
                    <TableCell>
                      {request.templateName}
                      <div className="text-xs text-slate-400">{request.categoryName}</div>
                    </TableCell>
                    <TableCell>{request.priority}</TableCell>
                    <TableCell className="font-mono text-xs">{request.referenceNumber ?? "—"}</TableCell>
                    <TableCell>
                      <StatusPill status={request.status} />
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mr-2"
                        onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                      >
                        {expandedId === request.id ? "Hide" : "Details"}
                      </Button>
                      {(request.status === "Pending" || request.status === "Approved") && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="mr-2"
                          isLoading={actingId === request.id}
                          onClick={() => handlePreview(request.id)}
                        >
                          Preview
                        </Button>
                      )}
                      {request.status === "Issued" && (
                        <Button
                          size="sm"
                          className="mr-2"
                          isLoading={actingId === request.id}
                          onClick={() => handleDownload(request.id)}
                        >
                          Download
                        </Button>
                      )}
                      {request.status === "Pending" && (
                        <Button size="sm" variant="danger" onClick={() => handleCancel(request.id)}>
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedId === request.id && (
                    <TableRow>
                      <TableCell colSpan={5} className="bg-slate-50">
                        <div className="space-y-1">
                          {request.reason && <p className="text-sm text-slate-600">Reason: {request.reason}</p>}
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                            Approval trail
                          </p>
                          <ul className="space-y-1">
                            {request.approvals.map((approval) => (
                              <li key={approval.id} className="text-sm text-slate-600">
                                {approval.stepOrder}.{" "}
                                {approval.approverType === "ReportingManager" ? "Reporting Manager" : approval.roleName}
                                {" — "}
                                <StatusPill status={approval.status} />
                                {approval.decidedByName && ` by ${approval.decidedByName}`}
                                {approval.comment && ` ("${approval.comment}")`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
