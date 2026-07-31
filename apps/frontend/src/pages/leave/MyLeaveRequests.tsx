import { Fragment, useEffect, useState } from "react";
import { LeaveRequestDto } from "@hrm-plus/shared";
import { Button, Card, PageHeader, StatusPill, Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@hrm-plus/ui";
import { cancelLeaveRequest, listMyLeaveRequests } from "../../api/leaveRequests";

export default function MyLeaveRequests() {
  const [requests, setRequests] = useState<LeaveRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  function refresh() {
    setLoading(true);
    listMyLeaveRequests()
      .then(setRequests)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load leave requests"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleCancel(id: number) {
    if (!window.confirm("Cancel this leave request?")) return;
    setError(null);
    try {
      await cancelLeaveRequest(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to cancel leave request");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="My Leave Requests" description="Track the status of leave you've applied for." />

      <Card>
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Leave Type</TableHeaderCell>
              <TableHeaderCell>Dates</TableHeaderCell>
              <TableHeaderCell>Days</TableHeaderCell>
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
                  You haven't applied for any leave yet.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              requests.map((request) => (
                <Fragment key={request.id}>
                  <TableRow>
                    <TableCell>{request.leaveTypeName}</TableCell>
                    <TableCell>
                      {request.startDate.slice(0, 10)} → {request.endDate.slice(0, 10)}
                    </TableCell>
                    <TableCell>{request.daysRequested}</TableCell>
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
