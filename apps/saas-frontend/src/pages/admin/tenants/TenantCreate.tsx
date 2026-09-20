import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PackageDto } from "@hrm-plus/shared";
import { Alert, Button, Card, Field, Input, PageHeader, Select, Textarea } from "@hrm-plus/ui";
import { listAdminPackages } from "../../../api/packages";
import { createSaasTenant } from "../../../api/tenants";

export default function TenantCreate() {
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
    packageId: "",
  });

  useEffect(() => {
    listAdminPackages()
      .then((all) => setPackages(all.filter((pkg) => pkg.isActive)))
      .catch(() => setPackages([]));
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createSaasTenant(
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
      navigate("/admin/tenants");
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to create company");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Create Company"
        description="Provision a new tenant directly. The company is approved and activated immediately, and the contact receives their login by email."
        actions={
          <Button variant="secondary" onClick={() => navigate("/admin/tenants")}>
            Cancel
          </Button>
        }
      />

      <Card className="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert>{error}</Alert>
          )}

          <Field label="Company name" required>
            <Input required value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
          </Field>
          <Field label="Type of company" required>
            <Input required value={form.companyType} onChange={(e) => set("companyType", e.target.value)} />
          </Field>
          <Field label="Company overview" required>
            <Textarea
              required
              rows={3}
              value={form.overview}
              onChange={(e) => set("overview", e.target.value)}
            />
          </Field>
          <Field label="Number of employees" required>
            <Input
              type="number"
              min={1}
              required
              value={form.numberOfEmployees}
              onChange={(e) => set("numberOfEmployees", e.target.value)}
            />
          </Field>
          <Field label="Contact email" required>
            <Input
              type="email"
              required
              value={form.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
            />
          </Field>
          <Field label="Subdomain prefix" required>
            <div className="flex items-center border border-slate-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-brand-500">
              <input
                required
                value={form.subdomainSlug}
                onChange={(e) => set("subdomainSlug", e.target.value.toLowerCase())}
                className="flex-1 px-3 py-2 text-sm outline-none"
                placeholder="acme"
              />
              <span className="px-3 text-slate-400 text-sm">.hrmplus.test</span>
            </div>
          </Field>
          <Field label="Package" required>
            <Select required value={form.packageId} onChange={(e) => set("packageId", e.target.value)}>
              <option value="">Select a package</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} — {pkg.price === 0 ? "Free" : `$${pkg.price.toFixed(2)}`}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Company logo (optional)">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm text-slate-600"
            />
          </Field>

          <Button type="submit" isLoading={submitting}>
            Create company
          </Button>
        </form>
      </Card>
    </div>
  );
}
