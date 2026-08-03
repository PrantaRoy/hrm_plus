import { Link } from "react-router-dom";
import { CheckSquare } from "lucide-react";
import { LeaveRequestDto } from "@hrm-plus/shared";
import { Card, EmptyState, StatusPill } from "@hrm-plus/ui";

export interface PendingLeaveApprovalsCardProps {
  count: number;
  preview: LeaveRequestDto[];
}

export function PendingLeaveApprovalsCard({ count, preview }: PendingLeaveApprovalsCardProps) {
  return (
    <Card
      title="Pending Leave Approvals"
      description={`${count} request${count === 1 ? "" : "s"} waiting on a decision`}
      actions={
        <Link to="/leave/approvals" className="text-sm text-brand-600 hover:underline">
          View all →
        </Link>
      }
    >
      {preview.length === 0 ? (
        <EmptyState icon={CheckSquare} title="Nothing pending right now" />
      ) : (
        <div className="space-y-3">
          {preview.map((request) => (
            <div key={request.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{request.employeeName}</p>
                <p className="truncate text-xs text-slate-500">
                  {request.leaveTypeName} · {request.startDate.slice(0, 10)} → {request.endDate.slice(0, 10)} ·{" "}
                  {request.daysRequested} day{request.daysRequested === 1 ? "" : "s"}
                </p>
              </div>
              <StatusPill status={request.status} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
