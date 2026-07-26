import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TenantApplicationDto } from "@hrm-plus/shared";
import { approveApplication, getApplication, rejectApplication, updateApplication } from "../../../api/applications";

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<TenantApplicationDto | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ companyName: "", companyType: "", overview: "", contactEmail: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    getApplication(Number(id)).then((app) => {
      setApplication(app);
      setForm({
        companyName: app.companyName,
        companyType: app.companyType,
        overview: app.overview,
        contactEmail: app.contactEmail,
      });
    });
  }, [id]);

  if (!application) return <p className="text-slate-400">Loading...</p>;

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      const updated = await updateApplication(application!.id, form);
      setApplication(updated);
      setEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to save changes");
    } finally {
      setBusy(false);
    }
  }

  async function handleApprove() {
    setBusy(true);
    setError(null);
    try {
      const updated = await approveApplication(application!.id);
      setApplication(updated);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to approve application");
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    setBusy(true);
    setError(null);
    try {
      const updated = await rejectApplication(application!.id, {});
      setApplication(updated);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to reject application");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500">
        ← Back
      </button>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{application.companyName}</h1>
            <p className="text-sm text-slate-500">{application.subdomainSlug}.hrmplus.test</p>
          </div>
          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{application.status}</span>
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
        )}

        {!editing ? (
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Type</dt>
            <dd className="text-slate-900">{application.companyType}</dd>
            <dt className="text-slate-500">Employees</dt>
            <dd className="text-slate-900">{application.numberOfEmployees}</dd>
            <dt className="text-slate-500">Contact email</dt>
            <dd className="text-slate-900">{application.contactEmail}</dd>
            <dt className="text-slate-500">Package</dt>
            <dd className="text-slate-900">{application.packageName}</dd>
            <dt className="text-slate-500">Overview</dt>
            <dd className="text-slate-900 col-span-2">{application.overview}</dd>
          </dl>
        ) : (
          <div className="space-y-3">
            {(["companyName", "companyType", "contactEmail"] as const).map((field) => (
              <label key={field} className="block text-sm">
                <span className="text-slate-700 font-medium capitalize">{field}</span>
                <input
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
                />
              </label>
            ))}
            <label className="block text-sm">
              <span className="text-slate-700 font-medium">Overview</span>
              <textarea
                value={form.overview}
                onChange={(e) => setForm((f) => ({ ...f, overview: e.target.value }))}
                rows={3}
                className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
              />
            </label>
          </div>
        )}

        {application.status === "Pending" && (
          <div className="flex gap-3 pt-2">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={busy}
                  className="bg-slate-900 text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Save
                </button>
                <button onClick={() => setEditing(false)} className="border border-slate-300 rounded px-4 py-2 text-sm">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="border border-slate-300 rounded px-4 py-2 text-sm">
                  Edit
                </button>
                <button
                  onClick={handleApprove}
                  disabled={busy}
                  className="bg-green-700 text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={handleReject}
                  disabled={busy}
                  className="bg-red-600 text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
