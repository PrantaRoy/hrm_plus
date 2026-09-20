import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApplicationStatus, TenantApplicationDto } from "@hrm-plus/shared";
import { Alert, Button, EmptyState, PageHeader, Select, StatusPill, Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@hrm-plus/ui";
import { approveApplication, listApplications, rejectApplication } from "../../../api/applications";

const STATUSES: (ApplicationStatus | "All")[] = ["All", "Pending", "Approved", "Rejected"];

export default function ApplicationList() {
  const [applications, setApplications] = useState<TenantApplicationDto[]>([]);
  const [status, setStatus] = useState<ApplicationStatus | "All">("Pending");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  function refresh() {
    listApplications(status === "All" ? undefined : status)
      .then(setApplications)
      .catch(() => setApplications([]));
  }

  useEffect(refresh, [status]);

  async function handleApprove(id: number) {
    setError(null);
    setBusyId(id);
    try {
      await approveApplication(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to approve application");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: number) {
    setError(null);
    setBusyId(id);
    try {
      await rejectApplication(id, {});
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to reject application");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tenant Applications"
        description="Review and act on new company signups."
        actions={
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as ApplicationStatus | "All")}
            className="w-40"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        }
      />

      {error && (
        <Alert>{error}</Alert>
      )}

      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Company</TableHeaderCell>
            <TableHeaderCell>Subdomain</TableHeaderCell>
            <TableHeaderCell>Package</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </tr>
        </TableHead>
        <tbody>
          {applications.map((app) => (
            <TableRow key={app.id}>
              <TableCell>
                <Link to={`/admin/applications/${app.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                  {app.companyName}
                </Link>
                <div className="text-xs text-slate-400">{app.contactEmail}</div>
              </TableCell>
              <TableCell>{app.subdomainSlug}</TableCell>
              <TableCell>{app.packageName}</TableCell>
              <TableCell>
                <StatusPill status={app.status} />
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {app.status === "Pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(app.id)}
                      disabled={busyId === app.id}
                      className="mr-2"
                    >
                      Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleReject(app.id)} disabled={busyId === app.id}>
                      Reject
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
          {applications.length === 0 && (
            <tr>
              <td colSpan={5}>
                <EmptyState title="No applications found" description="New signups will show up here." />
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
