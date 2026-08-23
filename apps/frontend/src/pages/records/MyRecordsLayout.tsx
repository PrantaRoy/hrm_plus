import { NavLink, Outlet } from "react-router-dom";
import { cn, PageHeader } from "@hrm-plus/ui";

const TABS = [
  { to: "/my-records/attendance", label: "Attendance" },
  { to: "/my-records/leave", label: "Leave" },
  { to: "/my-records/worksheet", label: "Worksheet" },
];

export default function MyRecordsLayout() {
  return (
    <div className="space-y-6">
      <PageHeader title="My Records" description="Your attendance, leave, and worked-hours history." />
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
