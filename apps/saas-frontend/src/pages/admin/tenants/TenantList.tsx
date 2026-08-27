import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SaasTenantDto } from "@hrm-plus/shared";
import {
  Button,
  EmptyState,
  Input,
  PageHeader,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import { listSaasTenants, toggleTenantStatus, updateSaasTenant } from "../../../api/tenants";

export default function TenantList() {
  const [tenants, setTenants] = useState<SaasTenantDto[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    listSaasTenants().then(setTenants).catch(() => setTenants([]));
  }

  useEffect(refresh, []);

  async function handleToggle(id: number) {
    setError(null);
    try {
      await toggleTenantStatus(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to update tenant status");
    }
  }

  function startEdit(tenant: SaasTenantDto) {
    setEditingId(tenant.id);
    setEditName(tenant.name);
  }

  async function saveEdit(id: number) {
    setError(null);
    try {
      await updateSaasTenant(id, { name: editName });
      setEditingId(null);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to save changes");
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Companies"
        description="Every tenant provisioned on the platform."
        actions={
          <Link to="/admin/tenants/new">
            <Button size="sm">Create company</Button>
          </Link>
        }
      />

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}

      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Company</TableHeaderCell>
            <TableHeaderCell>Subdomain</TableHeaderCell>
            <TableHeaderCell>Package</TableHeaderCell>
            <TableHeaderCell>Start date</TableHeaderCell>
            <TableHeaderCell>End date</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </tr>
        </TableHead>
        <tbody>
          {tenants.map((tenant) => (
            <TableRow key={tenant.id}>
              <TableCell className="font-medium text-slate-900">
                {editingId === tenant.id ? (
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-48" />
                ) : (
                  tenant.name
                )}
              </TableCell>
              <TableCell>{tenant.slug}</TableCell>
              <TableCell>{tenant.packageName ?? "—"}</TableCell>
              <TableCell>{tenant.startDate.slice(0, 10)}</TableCell>
              <TableCell>{tenant.endDate ? tenant.endDate.slice(0, 10) : "Unlimited"}</TableCell>
              <TableCell>
                <StatusPill status={tenant.status} />
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {editingId === tenant.id ? (
                  <>
                    <Button size="sm" onClick={() => saveEdit(tenant.id)} className="mr-2">
                      Save
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => startEdit(tenant)} className="mr-2">
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleToggle(tenant.id)}>
                      {tenant.status === "Active" ? "Deactivate" : "Activate"}
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
          {tenants.length === 0 && (
            <tr>
              <td colSpan={7}>
                <EmptyState title="No companies yet" description="Approved applications will appear here." />
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
