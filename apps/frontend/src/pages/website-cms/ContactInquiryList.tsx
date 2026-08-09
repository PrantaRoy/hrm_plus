import { useEffect, useState } from "react";
import { ContactInquiryDto, ContactInquiryStatus } from "@hrm-plus/shared";
import {
  Badge,
  BadgeColor,
  Button,
  EmptyState,
  PageHeader,
  Select,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import { deleteContactInquiry, listContactInquiries, updateContactInquiryStatus } from "../../api/contactInquiries";

const statusColor: Record<ContactInquiryStatus, BadgeColor> = {
  UNREAD: "amber",
  READ: "slate",
  ARCHIVED: "red",
};

export default function ContactInquiryList() {
  const [inquiries, setInquiries] = useState<ContactInquiryDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<ContactInquiryStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    listContactInquiries(statusFilter ? { status: statusFilter } : {})
      .then(setInquiries)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load contact inquiries"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [statusFilter]);

  async function handleStatusChange(id: number, status: ContactInquiryStatus) {
    setError(null);
    try {
      await updateContactInquiryStatus(id, status);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to update inquiry");
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this inquiry?")) return;
    setError(null);
    try {
      await deleteContactInquiry(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to delete inquiry");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Contact Inquiries"
        description="Leads submitted through the public website's contact form."
        actions={
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ContactInquiryStatus | "")} className="w-40">
            <option value="">All statuses</option>
            <option value="UNREAD">Unread</option>
            <option value="READ">Read</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        }
      />

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      {!loading && inquiries.length === 0 ? (
        <EmptyState title="No inquiries yet" description="Submissions from the public contact form will appear here." />
      ) : (
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>From</TableHeaderCell>
              <TableHeaderCell>Subject</TableHeaderCell>
              <TableHeaderCell>Message</TableHeaderCell>
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
            {!loading &&
              inquiries.map((inquiry) => (
                <TableRow key={inquiry.id}>
                  <TableCell>
                    <div className="font-medium text-slate-800">{inquiry.name}</div>
                    <div className="text-xs text-slate-400">{inquiry.email}</div>
                  </TableCell>
                  <TableCell>{inquiry.subject ?? "—"}</TableCell>
                  <TableCell className="max-w-sm truncate">{inquiry.message}</TableCell>
                  <TableCell>
                    <Badge color={statusColor[inquiry.status]}>{inquiry.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {inquiry.status !== "READ" && (
                      <Button size="sm" variant="secondary" onClick={() => handleStatusChange(inquiry.id, "READ")} className="mr-2">
                        Mark Read
                      </Button>
                    )}
                    {inquiry.status !== "ARCHIVED" && (
                      <Button size="sm" variant="secondary" onClick={() => handleStatusChange(inquiry.id, "ARCHIVED")} className="mr-2">
                        Archive
                      </Button>
                    )}
                    <Button size="sm" variant="danger" onClick={() => handleDelete(inquiry.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
