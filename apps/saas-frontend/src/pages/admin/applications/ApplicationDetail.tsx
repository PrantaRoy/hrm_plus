import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { TenantApplicationDto } from "@hrm-plus/shared";
import { Button, Card, Field, Input, Spinner, StatusPill, Textarea } from "@hrm-plus/ui";
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

  if (!application) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

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
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <Card>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{application.companyName}</h1>
              <p className="text-sm text-slate-500">{application.subdomainSlug}.hrmplus.test</p>
            </div>
            <StatusPill status={application.status} />
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
          )}

          {!editing ? (
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
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
              <Field label="Company name">
                <Input
                  value={form.companyName}
                  onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                />
              </Field>
              <Field label="Company type">
                <Input
                  value={form.companyType}
                  onChange={(e) => setForm((f) => ({ ...f, companyType: e.target.value }))}
                />
              </Field>
              <Field label="Contact email">
                <Input
                  value={form.contactEmail}
                  onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                />
              </Field>
              <Field label="Overview">
                <Textarea
                  rows={3}
                  value={form.overview}
                  onChange={(e) => setForm((f) => ({ ...f, overview: e.target.value }))}
                />
              </Field>
            </div>
          )}

          {application.status === "Pending" && (
            <div className="flex gap-3 pt-2">
              {editing ? (
                <>
                  <Button onClick={handleSave} isLoading={busy}>
                    Save
                  </Button>
                  <Button variant="secondary" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                  <Button onClick={handleApprove} isLoading={busy}>
                    Approve
                  </Button>
                  <Button variant="danger" onClick={handleReject} disabled={busy}>
                    Reject
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
