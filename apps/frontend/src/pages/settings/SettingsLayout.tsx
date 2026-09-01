import { NavLink, Outlet } from "react-router-dom";
import { cn, PageHeader } from "@hrm-plus/ui";

const TABS = [
  { to: "/settings/general", label: "General" },
  { to: "/settings/shifts", label: "Shifts" },
  { to: "/settings/weekdays", label: "Week Days" },
  { to: "/settings/leave-types", label: "Leave Types" },
  { to: "/settings/departments", label: "Departments" },
  { to: "/settings/designations", label: "Designations" },
  { to: "/settings/roles", label: "Roles" },
  { to: "/settings/attendance", label: "Attendance" },
  { to: "/settings/scheduler", label: "Scheduler" },
  { to: "/settings/attendance-ip-rules", label: "IP Rules" },
  { to: "/settings/attendance-locations", label: "Locations" },
];

export default function SettingsLayout() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure the lookup data used across your organisation." />
      <nav className="flex gap-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "px-3 py-2 text-sm border-b-2 transition-colors",
                isActive
                  ? "border-brand-600 text-brand-700 font-medium"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
