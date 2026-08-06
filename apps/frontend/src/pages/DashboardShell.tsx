import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { GeneralSettingsDto } from "@hrm-plus/shared";
import {
  BarChart3,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  Clock,
  FileCheck,
  FilePlus,
  FileClock,
  LayoutDashboard,
  LayoutTemplate,
  ListChecks,
  PartyPopper,
  Settings as SettingsIcon,
  ClipboardCheck,
  Users,
} from "lucide-react";
import { Logo, Sidebar, SidebarGroup, Topbar } from "@hrm-plus/ui";
import { useAuth } from "../auth/AuthContext";
import { getGeneralSettings } from "../api/generalSettings";
import { resolveFileUrl } from "../utils/fileUrl";

function applyBranding(settings: GeneralSettingsDto) {
  document.title = settings.siteTitle;
  const faviconUrl = resolveFileUrl(settings.faviconUrl);
  if (!faviconUrl) return;
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = faviconUrl;
}

export default function DashboardShell() {
  const { user, tenantSlug, logout } = useAuth();
  const role = user?.role;
  const isAdminOrHr = role === "Admin" || role === "HR";
  const isApprover = role === "Admin" || role === "HR" || role === "Manager";
  const [branding, setBranding] = useState<GeneralSettingsDto | null>(null);

  useEffect(() => {
    getGeneralSettings()
      .then((settings) => {
        setBranding(settings);
        applyBranding(settings);
      })
      .catch(() => undefined);
  }, []);

  const groups: SidebarGroup[] = [
    {
      items: [{ key: "dashboard", label: "Dashboard", to: "/", icon: LayoutDashboard, end: true }],
    },
    {
      label: "My Work",
      items: [
        { key: "my-schedule", label: "My Schedule", to: "/my-schedule", icon: Clock },
        { key: "leave-apply", label: "Apply Leave", to: "/leave/apply", icon: CalendarPlus },
        { key: "leave-my-requests", label: "My Leave Requests", to: "/leave/my-requests", icon: ListChecks },
        { key: "documents-request", label: "Request Document", to: "/documents/request", icon: FilePlus },
        { key: "documents-my-requests", label: "My Document Requests", to: "/documents/my-requests", icon: FileClock },
      ],
    },
    ...(isApprover
      ? [
          {
            label: "Approvals",
            items: [
              { key: "leave-approvals", label: "Leave Approvals", to: "/leave/approvals", icon: ClipboardCheck },
              { key: "document-approvals", label: "Document Approvals", to: "/documents/approvals", icon: FileCheck },
            ],
          },
        ]
      : []),
    {
      label: "People",
      items: [{ key: "employees", label: "Employees", to: "/employees", icon: Users }],
    },
    ...(isApprover
      ? [
          {
            label: "Scheduling",
            items: [
              ...(isAdminOrHr
                ? [{ key: "duty-schedules", label: "Duty Schedules", to: "/duty-schedules", icon: CalendarRange }]
                : []),
              { key: "rosters", label: "Rosters", to: "/rosters", icon: CalendarDays },
              ...(isAdminOrHr ? [{ key: "holidays", label: "Holidays", to: "/holidays", icon: PartyPopper }] : []),
            ],
          },
        ]
      : []),
    ...(isApprover
      ? [
          {
            label: "Reports",
            items: [{ key: "records", label: "Records", to: "/records", icon: BarChart3 }],
          },
        ]
      : []),
    ...(isAdminOrHr
      ? [
          {
            label: "Organisation",
            items: [
              { key: "document-templates", label: "Document Templates", to: "/document-templates", icon: LayoutTemplate },
              { key: "settings", label: "Settings", to: "/settings", icon: SettingsIcon },
            ],
          },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        header={<Logo size="sm" imageSrc={resolveFileUrl(branding?.logoUrl)} wordmark={branding?.siteTitle} />}
        groups={groups}
      />
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
