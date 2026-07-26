import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApplicationStatus, TenantApplicationDto } from "@hrm-plus/shared";
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Tenant Applications</h1>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ApplicationStatus | "All")}
          className="border border-slate-300 rounded px-3 py-2 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

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
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id} className="border-t border-slate-100">
                <td className="px-4 py-2">
                  <Link to={`/admin/applications/${app.id}`} className="text-slate-900 font-medium">
                    {app.companyName}
                  </Link>
                  <div className="text-xs text-slate-400">{app.contactEmail}</div>
                </td>
                <td className="px-4 py-2 text-slate-600">{app.subdomainSlug}</td>
                <td className="px-4 py-2 text-slate-600">{app.packageName}</td>
                <td className="px-4 py-2 text-slate-600">{app.status}</td>
                <td className="px-4 py-2 space-x-3">
                  {app.status === "Pending" && (
                    <>
                      <button
                        onClick={() => handleApprove(app.id)}
                        disabled={busyId === app.id}
                        className="text-green-700 underline disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(app.id)}
                        disabled={busyId === app.id}
                        className="text-red-600 underline disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No applications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
