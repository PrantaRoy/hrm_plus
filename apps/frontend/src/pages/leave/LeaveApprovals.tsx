import { useEffect, useState } from "react";
import { LeaveRequestDto } from "@hrm-plus/shared";
import {
  Button,
  Card,
  PageHeader,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Textarea,
} from "@hrm-plus/ui";
import { approveLeaveRequest, listPendingMyApproval, rejectLeaveRequest } from "../../api/leaveRequests";

export default function LeaveApprovals() {
  const [requests, setRequests] = useState<LeaveRequestDto[]>([]);
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

  async function handleDecision(id: number, decision: "approve" | "reject") {
    setActingId(id);
    setError(null);
    try {
      const comment = comments[id] || undefined;
      if (decision === "approve") {
        await approveLeaveRequest(id, { comment });
      } else {
        await rejectLeaveRequest(id, { comment });
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
      <PageHeader title="Leave Approvals" description="Requests currently waiting on your decision." />

      <Card>
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Employee</TableHeaderCell>
              <TableHeaderCell>Leave Type</TableHeaderCell>
              <TableHeaderCell>Dates</TableHeaderCell>
              <TableHeaderCell>Days</TableHeaderCell>
              <TableHeaderCell>Step</TableHeaderCell>
              <TableHeaderCell>Comment</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-400 py-6">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading && requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-400 py-6">
                  Nothing is waiting on your approval.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              requests.map((request) => {
                const currentStep = request.approvals.find((a) => a.stepOrder === request.currentStepOrder);
                return (
                  <TableRow key={request.id}>
                    <TableCell>{request.employeeName}</TableCell>
                    <TableCell>{request.leaveTypeName}</TableCell>
                    <TableCell>
                      {request.startDate.slice(0, 10)} → {request.endDate.slice(0, 10)}
                    </TableCell>
                    <TableCell>{request.daysRequested}</TableCell>
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
                );
              })}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
