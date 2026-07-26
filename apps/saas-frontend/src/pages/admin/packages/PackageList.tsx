import { FormEvent, useEffect, useState } from "react";
import { PackageDto } from "@hrm-plus/shared";
import { createPackage, deletePackage, listAdminPackages, updatePackage } from "../../../api/packages";

export default function PackageList() {
  const [packages, setPackages] = useState<PackageDto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    listAdminPackages().then(setPackages).catch(() => setPackages([]));
  }

  useEffect(refresh, []);

  async function handleToggleActive(pkg: PackageDto) {
    await updatePackage(pkg.id, { isActive: !pkg.isActive });
    refresh();
  }

  async function handleDelete(pkg: PackageDto) {
    setError(null);
    try {
      await deletePackage(pkg.id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to delete package");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Packages</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-slate-900 text-white rounded px-4 py-2 text-sm font-medium"
        >
          {showForm ? "Cancel" : "New Package"}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
      )}

      {showForm && (
        <PackageForm
          onCreated={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Validity</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg) => (
              <tr key={pkg.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-900">{pkg.name}</td>
                <td className="px-4 py-2 text-slate-600">
                  {pkg.price === 0 ? "Free" : `$${pkg.price.toFixed(2)}`}
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {pkg.validityDays ? `${pkg.validityDays} days` : "Unlimited"}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={
                      pkg.isActive
                        ? "text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs"
                        : "text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-xs"
                    }
                  >
                    {pkg.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-2 space-x-3">
                  <button onClick={() => handleToggleActive(pkg)} className="text-slate-600 underline">
                    {pkg.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => handleDelete(pkg)} className="text-red-600 underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {packages.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No packages yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PackageForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [unlimited, setUnlimited] = useState(true);
  const [validityDays, setValidityDays] = useState("30");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createPackage({
        name,
        price: Number(price),
        validityDays: unlimited ? null : Number(validityDays),
      });
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to create package");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 max-w-md">
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
      )}
      <label className="block text-sm">
        <span className="text-slate-700 font-medium">Name</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="text-slate-700 font-medium">Price (0 = free)</span>
        <input
          type="number"
          min="0"
          step="0.01"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} />
        <span className="text-slate-700 font-medium">Unlimited validity</span>
      </label>
      {!unlimited && (
        <label className="block text-sm">
          <span className="text-slate-700 font-medium">Validity (days)</span>
          <select
            value={validityDays}
            onChange={(e) => setValidityDays(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
          >
            {[7, 15, 30, 180, 365].map((d) => (
              <option key={d} value={d}>
                {d} days
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-slate-900 text-white rounded py-2 font-medium disabled:opacity-50"
      >
        {submitting ? "Creating..." : "Create package"}
      </button>
    </form>
  );
}
