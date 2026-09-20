import { useState } from "react";
import { Outlet } from "react-router-dom";
import {
  Building2,
  FileText,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  LifeBuoy,
  Newspaper,
  Package,
  Rows3,
  Tag,
} from "lucide-react";
import { Logo, Sidebar, SidebarGroup, Topbar } from "@hrm-plus/ui";
import { useSaasAuth } from "../../auth/SaasAuthContext";

const NAV_GROUPS: SidebarGroup[] = [
  {
    items: [
      { key: "overview", label: "Overview", to: "/admin/overview", icon: LayoutDashboard },
      { key: "applications", label: "Applications", to: "/admin/applications", icon: FileText },
      { key: "tenants", label: "Companies", to: "/admin/tenants", icon: Building2 },
      { key: "packages", label: "Packages", to: "/admin/packages", icon: Package },
    ],
  },
  {
    label: "Website",
    items: [
      { key: "landing", label: "Landing Content", to: "/admin/landing", icon: LayoutTemplate, end: true },
      { key: "landing-blocks", label: "Sections", to: "/admin/landing/blocks", icon: Rows3 },
      { key: "blog", label: "Blog", to: "/admin/blog", icon: Newspaper },
      { key: "contact", label: "Contact Inbox", to: "/admin/contact", icon: Inbox },
    ],
  },
  {
    label: "Support",
    items: [
      { key: "support-tickets", label: "Support Tickets", to: "/admin/support-tickets", icon: LifeBuoy },
      { key: "ticket-categories", label: "Ticket Categories", to: "/admin/ticket-categories", icon: Tag },
    ],
  },
];

export default function DashboardShell() {
  const { admin, logout } = useSaasAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        header={<Logo size="sm" tone="light" />}
        groups={NAV_GROUPS}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title="Super Admin"
          userName={admin?.email ?? ""}
          userMeta="Platform administrator"
          onSignOut={logout}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
