import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SAAS_CONTACT_STATUSES, SaasContactStatus, SaasContactSubmissionDto } from "@hrm-plus/shared";
import {
  Badge,
  EmptyState,
  PageHeader,
  Select,
  Spinner,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import { listContactSubmissions } from "../../../api/contact";

const STATUS_COLOR: Record<SaasContactStatus, "amber" | "slate" | "green"> = {
  UNREAD: "amber",
  READ: "slate",
  ARCHIVED: "green",
};

export default function ContactInboxList() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SaasContactStatus | "">("");
  const [rows, setRows] = useState<SaasContactSubmissionDto[] | null>(null);

  useEffect(() => {
    setRows(null);
    listContactSubmissions(status ? { status } : {})
      .then(setRows)
      .catch(() => setRows([]));
  }, [status]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Contact Inbox"
        description="Messages submitted through the marketing site contact form."
        actions={
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as SaasContactStatus | "")}
            className="w-40"
          >
            <option value="">All statuses</option>
            {SAAS_CONTACT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        }
      />

      {rows === null ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Subject</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Received</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => navigate(`/admin/contact/${row.id}`)}
              >
                <TableCell className="font-medium text-slate-900">{row.name}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.subject ?? "—"}</TableCell>
                <TableCell>
                  <Badge color={STATUS_COLOR[row.status]}>
                    {row.status.charAt(0) + row.status.slice(1).toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <EmptyState title="No messages" description="New submissions will show up here." />
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </div>
  );
}
