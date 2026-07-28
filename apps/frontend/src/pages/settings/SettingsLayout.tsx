import { NavLink, Outlet } from "react-router-dom";

const TABS = [
  { to: "/settings/shifts", label: "Shifts" },
  { to: "/settings/weekdays", label: "Week Days" },
  { to: "/settings/leave-types", label: "Leave Types" },
  { to: "/settings/departments", label: "Departments" },
  { to: "/settings/designations", label: "Designations" },
  { to: "/settings/roles", label: "Roles" },
];

export default function SettingsLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 mb-3">Settings</h1>
        <nav className="flex gap-1 border-b border-slate-200">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `px-3 py-2 text-sm border-b-2 ${
                  isActive
                    ? "border-slate-900 text-slate-900 font-medium"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
