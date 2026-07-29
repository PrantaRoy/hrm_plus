import { Outlet } from "react-router-dom";
import { Building2, FileText, LayoutDashboard, Package } from "lucide-react";
import { Logo, Sidebar, SidebarNavItem, Topbar } from "@hrm-plus/ui";
import { useSaasAuth } from "../../auth/SaasAuthContext";

const NAV_ITEMS: SidebarNavItem[] = [
  { key: "overview", label: "Overview", to: "/admin/overview", icon: LayoutDashboard },
  { key: "packages", label: "Packages", to: "/admin/packages", icon: Package },
  { key: "applications", label: "Applications", to: "/admin/applications", icon: FileText },
  { key: "tenants", label: "Companies", to: "/admin/tenants", icon: Building2 },
];

export default function DashboardShell() {
  const { admin, logout } = useSaasAuth();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar header={<Logo size="sm" />} items={NAV_ITEMS} />
      <div className="flex flex-1 flex-col">
        <Topbar title="Super Admin" userName={admin?.email ?? ""} onSignOut={logout} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
