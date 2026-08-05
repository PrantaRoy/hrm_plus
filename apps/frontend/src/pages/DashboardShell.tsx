import { Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Settings,
  CalendarClock,
  CalendarDays,
  CalendarCheck,
  CalendarOff,
  ClipboardCheck,
  CheckSquare,
  FileBarChart,
  PartyPopper,
  FileText,
  FilePlus2,
  FileCheck2,
} from "lucide-react";
import { Logo, Sidebar, SidebarNavItem, Topbar } from "@hrm-plus/ui";
import { useAuth } from "../auth/AuthContext";

export default function DashboardShell() {
  const { user, tenantSlug, logout } = useAuth();

  const items: SidebarNavItem[] = [
    { key: "dashboard", label: "Dashboard", to: "/", icon: LayoutDashboard, end: true },
    { key: "employees", label: "Employees", to: "/employees", icon: Users },
    { key: "my-schedule", label: "My Schedule", to: "/my-schedule", icon: CalendarCheck },
    { key: "leave-apply", label: "Apply for Leave", to: "/leave/apply", icon: CalendarOff },
    { key: "leave-my-requests", label: "My Leave Requests", to: "/leave/my-requests", icon: ClipboardCheck },
    { key: "leave-approvals", label: "Leave Approvals", to: "/leave/approvals", icon: CheckSquare },
    { key: "documents-request", label: "Request Document", to: "/documents/request", icon: FilePlus2 },
    { key: "documents-my-requests", label: "My Document Requests", to: "/documents/my-requests", icon: FileText },
    { key: "documents-approvals", label: "Document Approvals", to: "/documents/approvals", icon: FileCheck2 },
  ];
  if (user?.role === "Admin" || user?.role === "HR") {
    items.push({ key: "duty-schedules", label: "Duty Schedules", to: "/duty-schedules", icon: CalendarClock });
    items.push({ key: "holidays", label: "Holidays", to: "/holidays", icon: PartyPopper });
    items.push({ key: "document-templates", label: "Document Templates", to: "/document-templates", icon: FileText });
  }
  if (user?.role === "Admin" || user?.role === "HR" || user?.role === "Manager") {
    items.push({ key: "rosters", label: "Rosters", to: "/rosters", icon: CalendarDays });
    items.push({ key: "records", label: "Records", to: "/records", icon: FileBarChart });
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
