import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PackageDto } from "@hrm-plus/shared";
import { listPublicPackages } from "../../api/packages";

function formatPrice(pkg: PackageDto): string {
  if (pkg.price === 0) return "Free";
  return `$${pkg.price.toFixed(2)}`;
}

function formatValidity(pkg: PackageDto): string {
  return pkg.validityDays ? `${pkg.validityDays} days` : "Unlimited";
}

export default function Landing() {
  const [packages, setPackages] = useState<PackageDto[]>([]);

  useEffect(() => {
    listPublicPackages().then(setPackages).catch(() => setPackages([]));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-slate-900 text-lg">HRM PLUS</span>
        <Link to="/admin/login" className="text-sm text-slate-500 hover:text-slate-900">
          Super-admin login
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl font-bold text-slate-900">Workforce management, without the overhead</h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          Set up your organisation's HR workspace in minutes. Pick a plan below to get started.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white border border-slate-200 rounded-lg p-6 text-left flex flex-col"
            >
              <h2 className="text-xl font-semibold text-slate-900">{pkg.name}</h2>
              <p className="mt-2 text-3xl font-bold text-slate-900">{formatPrice(pkg)}</p>
              <p className="text-sm text-slate-500">Validity: {formatValidity(pkg)}</p>
              <Link
                to={`/signup?packageId=${pkg.id}`}
                className="mt-6 bg-slate-900 text-white rounded py-2 text-center font-medium"
              >
                Get Started
              </Link>
            </div>
          ))}
          {packages.length === 0 && (
            <p className="col-span-full text-slate-400">No packages available yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}
