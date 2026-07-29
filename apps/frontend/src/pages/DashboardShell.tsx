import { Outlet } from "react-router-dom";
import { LayoutDashboard, Users, Settings, CalendarClock, CalendarDays, CalendarCheck } from "lucide-react";
import { Logo, Sidebar, SidebarNavItem, Topbar } from "@hrm-plus/ui";
import { useAuth } from "../auth/AuthContext";

export default function DashboardShell() {
  const { user, tenantSlug, logout } = useAuth();

  const items: SidebarNavItem[] = [
    { key: "dashboard", label: "Dashboard", to: "/", icon: LayoutDashboard, end: true },
    { key: "employees", label: "Employees", to: "/employees", icon: Users },
    { key: "my-schedule", label: "My Schedule", to: "/my-schedule", icon: CalendarCheck },
  ];
  if (user?.role === "Admin" || user?.role === "HR") {
    items.push({ key: "duty-schedules", label: "Duty Schedules", to: "/duty-schedules", icon: CalendarClock });
  }
  if (user?.role === "Admin" || user?.role === "HR" || user?.role === "Manager") {
    items.push({ key: "rosters", label: "Rosters", to: "/rosters", icon: CalendarDays });
  }
  if (user?.role === "Admin" || user?.role === "HR") {
    items.push({ key: "settings", label: "Settings", to: "/settings", icon: Settings });
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar header={<Logo size="sm" />} items={items} />
      <div className="flex flex-1 flex-col">
        <Topbar
          userName={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()}
          userMeta={`${user?.role ?? ""} · ${tenantSlug ?? ""}`}
          onSignOut={logout}
        />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
