import { useEffect, useState } from "react";
import { SaasTenantDto } from "@hrm-plus/shared";
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
      <h1 className="text-xl font-semibold text-slate-900">Companies</h1>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Company</th>
              <th className="px-4 py-2">Subdomain</th>
              <th className="px-4 py-2">Package</th>
              <th className="px-4 py-2">Start date</th>
              <th className="px-4 py-2">End date</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-900">
                  {editingId === tenant.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="border border-slate-300 rounded px-2 py-1 text-sm"
                    />
                  ) : (
                    tenant.name
                  )}
                </td>
                <td className="px-4 py-2 text-slate-600">{tenant.slug}</td>
                <td className="px-4 py-2 text-slate-600">{tenant.packageName ?? "—"}</td>
                <td className="px-4 py-2 text-slate-600">{tenant.startDate.slice(0, 10)}</td>
                <td className="px-4 py-2 text-slate-600">
                  {tenant.endDate ? tenant.endDate.slice(0, 10) : "Unlimited"}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={
                      tenant.status === "Active"
                        ? "text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs"
                        : "text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-xs"
                    }
                  >
                    {tenant.status}
                  </span>
                </td>
                <td className="px-4 py-2 space-x-3">
                  {editingId === tenant.id ? (
                    <>
                      <button onClick={() => saveEdit(tenant.id)} className="text-slate-900 underline">
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-slate-500 underline">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(tenant)} className="text-slate-600 underline">
                        Edit
                      </button>
                      <button onClick={() => handleToggle(tenant.id)} className="text-red-600 underline">
                        {tenant.status === "Active" ? "Deactivate" : "Activate"}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  No companies yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
