import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PackageDto } from "@hrm-plus/shared";
import { listPublicPackages } from "../../api/packages";
import { submitApplication } from "../../api/applications";

export default function SignupForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<PackageDto[]>([]);
  const [logo, setLogo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    companyType: "",
    overview: "",
    numberOfEmployees: "",
    contactEmail: "",
    subdomainSlug: "",
    packageId: searchParams.get("packageId") ?? "",
  });

  useEffect(() => {
    listPublicPackages().then(setPackages).catch(() => setPackages([]));
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const application = await submitApplication(
        {
          companyName: form.companyName,
          companyType: form.companyType,
          overview: form.overview,
          numberOfEmployees: Number(form.numberOfEmployees),
          contactEmail: form.contactEmail,
          subdomainSlug: form.subdomainSlug.toLowerCase(),
          packageId: Number(form.packageId),
        },
        logo
      );
      navigate("/signup/pending", { state: { companyName: application.companyName } });
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-semibold text-slate-900 mb-6">Set up your company</h1>
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}

          <Field label="Company name" value={form.companyName} onChange={(v) => set("companyName", v)} />
          <Field label="Type of company" value={form.companyType} onChange={(v) => set("companyType", v)} />
          <label className="block text-sm">
            <span className="text-slate-700 font-medium">Company overview</span>
            <textarea
              required
              value={form.overview}
              onChange={(e) => set("overview", e.target.value)}
              rows={3}
              className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
            />
          </label>
          <Field
            label="Number of employees"
            type="number"
            value={form.numberOfEmployees}
            onChange={(v) => set("numberOfEmployees", v)}
          />
          <Field
            label="Contact email"
            type="email"
            value={form.contactEmail}
            onChange={(v) => set("contactEmail", v)}
          />
          <label className="block text-sm">
            <span className="text-slate-700 font-medium">Subdomain prefix</span>
            <div className="mt-1 flex items-center border border-slate-300 rounded overflow-hidden">
              <input
                required
                value={form.subdomainSlug}
                onChange={(e) => set("subdomainSlug", e.target.value.toLowerCase())}
                className="flex-1 px-3 py-2 outline-none"
                placeholder="acme"
              />
              <span className="px-3 text-slate-400 text-sm">.hrmplus.test</span>
            </div>
          </label>
          <label className="block text-sm">
            <span className="text-slate-700 font-medium">Package</span>
            <select
              required
              value={form.packageId}
              onChange={(e) => set("packageId", e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
            >
              <option value="">Select a package</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} — {pkg.price === 0 ? "Free" : `$${pkg.price.toFixed(2)}`}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-700 font-medium">Company logo (optional)</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-slate-900 text-white rounded py-2 font-medium disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit application"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-700 font-medium">{label}</span>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
      />
    </label>
  );
}
