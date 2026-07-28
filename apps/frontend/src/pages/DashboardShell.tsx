import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function DashboardShell() {
  const { user, tenantSlug, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-slate-900">HRM PLUS</span>
          <nav className="flex gap-4 text-sm">
            <NavLink
              to="/employees"
              className={({ isActive }) =>
                isActive ? "text-slate-900 font-medium" : "text-slate-500 hover:text-slate-700"
              }
            >
              Employees
            </NavLink>
            {(user?.role === "Admin" || user?.role === "HR") && (
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  isActive ? "text-slate-900 font-medium" : "text-slate-500 hover:text-slate-700"
                }
              >
                Settings
              </NavLink>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span>
            {user?.firstName} {user?.lastName} · {user?.role} · {tenantSlug}
          </span>
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
