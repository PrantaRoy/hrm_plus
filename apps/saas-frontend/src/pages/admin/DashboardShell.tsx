import { Outlet } from "react-router-dom";
import { Building2, FileText, LayoutDashboard, LifeBuoy, Package, Tag } from "lucide-react";
import { Logo, Sidebar, SidebarGroup, Topbar } from "@hrm-plus/ui";
import { useSaasAuth } from "../../auth/SaasAuthContext";

const NAV_GROUPS: SidebarGroup[] = [
  {
    items: [
      { key: "overview", label: "Overview", to: "/admin/overview", icon: LayoutDashboard },
      { key: "packages", label: "Packages", to: "/admin/packages", icon: Package },
      { key: "applications", label: "Applications", to: "/admin/applications", icon: FileText },
      { key: "tenants", label: "Companies", to: "/admin/tenants", icon: Building2 },
      { key: "support-tickets", label: "Support Tickets", to: "/admin/support-tickets", icon: LifeBuoy },
      { key: "ticket-categories", label: "Ticket Categories", to: "/admin/ticket-categories", icon: Tag },
    ],
  },
];

export default function DashboardShell() {
  const { admin, logout } = useSaasAuth();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar header={<Logo size="sm" />} groups={NAV_GROUPS} />
      <div className="flex flex-1 flex-col">
        <Topbar title="Super Admin" userName={admin?.email ?? ""} onSignOut={logout} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
