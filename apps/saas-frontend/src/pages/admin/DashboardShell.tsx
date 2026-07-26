import { NavLink, Outlet } from "react-router-dom";
import { useSaasAuth } from "../../auth/SaasAuthContext";

export default function DashboardShell() {
  const { admin, logout } = useSaasAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "text-slate-900 font-medium" : "text-slate-500 hover:text-slate-700";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-slate-900">HRM PLUS — Super Admin</span>
          <nav className="flex gap-4 text-sm">
            <NavLink to="/admin/overview" className={linkClass}>
              Overview
            </NavLink>
            <NavLink to="/admin/packages" className={linkClass}>
              Packages
            </NavLink>
            <NavLink to="/admin/applications" className={linkClass}>
              Applications
            </NavLink>
            <NavLink to="/admin/tenants" className={linkClass}>
              Companies
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span>{admin?.email}</span>
          <button onClick={logout} className="text-slate-500 hover:text-slate-900">
            Sign out
          </button>
        </div>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
