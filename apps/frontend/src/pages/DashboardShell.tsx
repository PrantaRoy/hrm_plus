import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { GeneralSettingsDto } from "@hrm-plus/shared";
import {
  BarChart3,
  Boxes,
  Briefcase,
  Building2,
  CalendarDays,
  CalendarPlus,
  CalendarClock,
  CalendarRange,
  Clock,
  DollarSign,
  FileCheck,
  FilePlus,
  FileClock,
  FileText,
  FolderKanban,
  Globe,
  Image,
  Images,
  Landmark,
  Layout,
  LayoutDashboard,
  LayoutTemplate,
  LifeBuoy,
  ListChecks,
  ListTodo,
  Mail,
  Newspaper,
  Package,
  PartyPopper,
  Receipt,
  Settings as SettingsIcon,
  Share2,
  ClipboardCheck,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { Logo, Sidebar, SidebarGroup, Topbar } from "@hrm-plus/ui";
import { useAuth } from "../auth/AuthContext";
import { getGeneralSettings } from "../api/generalSettings";
import { resolveFileUrl } from "../utils/fileUrl";
import { useDashboardMode } from "../hooks/useDashboardMode";

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

const MY_WORK_ITEMS = [
  { key: "my-schedule", label: "My Schedule", to: "/my-schedule", icon: Clock },
  { key: "my-meetings", label: "My Meetings", to: "/meetings", icon: CalendarClock },
  { key: "my-tasks", label: "My Tasks", to: "/tasks/my", icon: ListTodo },
  { key: "leave-apply", label: "Apply Leave", to: "/leave/apply", icon: CalendarPlus },
  { key: "leave-my-requests", label: "My Leave Requests", to: "/leave/my-requests", icon: ListChecks },
  { key: "documents-request", label: "Request Document", to: "/documents/request", icon: FilePlus },
  { key: "documents-my-requests", label: "My Document Requests", to: "/documents/my-requests", icon: FileClock },
  { key: "my-payslips", label: "My Payslips", to: "/payroll/my-payslips", icon: Receipt },
];

// Everyone sees the projects they belong to; managers also get the cross-project task list and clients.
const PROJECTS_MEMBER_GROUP: SidebarGroup = {
  label: "Projects",
  items: [{ key: "projects", label: "Projects", to: "/projects", icon: FolderKanban }],
};

const PROJECTS_MANAGER_GROUP: SidebarGroup = {
  label: "Projects",
  items: [
    { key: "projects", label: "Projects", to: "/projects", icon: FolderKanban },
    { key: "tasks-all", label: "Tasks", to: "/tasks", icon: ListTodo, end: true },
    { key: "clients", label: "Clients", to: "/clients", icon: Building2 },
  ],
};

function buildStaffViewGroups(): SidebarGroup[] {
  return [
    { items: [{ key: "dashboard", label: "Dashboard", to: "/", icon: LayoutDashboard, end: true }] },
    { label: "My Work", items: MY_WORK_ITEMS },
    PROJECTS_MEMBER_GROUP,
    {
      label: "My Records",
      items: [{ key: "my-records", label: "Records", to: "/my-records", icon: BarChart3 }],
    },
    {
      label: "My Assets",
      items: [{ key: "my-assets", label: "Assets", to: "/my-assets", icon: Package }],
    },
  ];
}

function buildAdminViewGroups(isAdmin: boolean): SidebarGroup[] {
  return [
    { items: [{ key: "dashboard", label: "Dashboard", to: "/", icon: LayoutDashboard, end: true }] },
    ...(isAdmin
      ? [
          {
            label: "Support",
            items: [{ key: "support-tickets", label: "Support Tickets", to: "/support-tickets", icon: LifeBuoy }],
          },
        ]
      : []),
    {
      label: "Approvals",
      items: [
        { key: "leave-approvals", label: "Leave Approvals", to: "/leave/approvals", icon: ClipboardCheck },
        { key: "document-approvals", label: "Document Approvals", to: "/documents/approvals", icon: FileCheck },
      ],
    },
    {
      label: "People",
      items: [{ key: "employees", label: "Employees", to: "/employees", icon: Users }],
    },
    {
      label: "Scheduling",
      items: [
        { key: "duty-schedules", label: "Duty Schedules", to: "/duty-schedules", icon: CalendarRange },
        { key: "rosters", label: "Rosters", to: "/rosters", icon: CalendarDays },
        { key: "meetings-all", label: "Meetings", to: "/meetings/all", icon: CalendarClock },
        { key: "holidays", label: "Holidays", to: "/holidays", icon: PartyPopper },
      ],
    },
    PROJECTS_MANAGER_GROUP,
    {
      label: "Reports",
      items: [{ key: "records", label: "Records", to: "/records", icon: BarChart3 }],
    },
    {
      label: "Recruitment",
      items: [
        { key: "jobs", label: "Job Circulars", to: "/jobs", icon: Briefcase },
        { key: "screening-questions", label: "Screening Questions", to: "/screening-questions", icon: ListChecks },
      ],
    },
    {
      label: "Assets & Fleet",
      items: [{ key: "assets", label: "Assets", to: "/assets", icon: Package }],
    },
    {
      label: "Payroll",
      items: [
        { key: "payroll-pay-cycles", label: "Pay Cycles", to: "/payroll/pay-cycles", icon: CalendarRange },
        { key: "payroll-pay-rates", label: "Employee Pay Rates", to: "/payroll/pay-rates", icon: DollarSign },
        { key: "payroll-work-reports", label: "Work Reports", to: "/payroll/work-reports", icon: ClipboardCheck },
        { key: "payroll-settings", label: "Payroll Settings", to: "/payroll/settings", icon: SettingsIcon },
      ],
    },
    {
      label: "Organisation",
      items: [
        { key: "document-templates", label: "Document Templates", to: "/document-templates", icon: LayoutTemplate },
        { key: "settings", label: "Settings", to: "/settings", icon: SettingsIcon },
      ],
    },
    {
      label: "Website CMS",
      items: [
        { key: "cms-site-settings", label: "Site Settings", to: "/website-cms/settings", icon: Globe },
        { key: "cms-sections", label: "Sections", to: "/website-cms/sections", icon: Layout },
        { key: "cms-hero-slides", label: "Hero Slides", to: "/website-cms/hero-slides", icon: Image },
        { key: "cms-services", label: "Services", to: "/website-cms/services", icon: Boxes },
        { key: "cms-gallery", label: "Gallery", to: "/website-cms/gallery", icon: Images },
        { key: "cms-blog", label: "Blog", to: "/website-cms/blog", icon: Newspaper },
        { key: "cms-inquiries", label: "Contact Inquiries", to: "/website-cms/contact-inquiries", icon: Mail },
        { key: "cms-social", label: "Social Links", to: "/website-cms/social-links", icon: Share2 },
        { key: "cms-legal", label: "Legal Pages", to: "/website-cms/legal-pages", icon: FileText },
      ],
    },
  ];
}

function buildDefaultViewGroups(role: string | undefined): SidebarGroup[] {
  const isApprover = role === "Manager";
  const isPayroll = role === "Payroll";
  const isPayrollProcessor = role === "Payroll" || role === "Finance";

  return [
    { items: [{ key: "dashboard", label: "Dashboard", to: "/", icon: LayoutDashboard, end: true }] },
    { label: "My Work", items: MY_WORK_ITEMS },
    isApprover ? PROJECTS_MANAGER_GROUP : PROJECTS_MEMBER_GROUP,
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
    ...(isApprover
      ? [
          {
            label: "People",
            items: [{ key: "employees", label: "Employees", to: "/employees", icon: Users }],
          },
        ]
      : []),
    ...(isApprover
      ? [
          {
            label: "Scheduling",
            items: [
              { key: "rosters", label: "Rosters", to: "/rosters", icon: CalendarDays },
              { key: "meetings-all", label: "Meetings", to: "/meetings/all", icon: CalendarClock },
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
    ...(isApprover
      ? [
          {
            label: "Assets & Fleet",
            items: [{ key: "assets", label: "Assets", to: "/assets", icon: Package }],
          },
        ]
      : []),
    ...(isPayroll || isPayrollProcessor
      ? [
          {
            label: "Payroll",
            items: [
              ...(isPayroll
                ? [
                    { key: "payroll-pay-cycles", label: "Pay Cycles", to: "/payroll/pay-cycles", icon: CalendarRange },
                    { key: "payroll-pay-rates", label: "Employee Pay Rates", to: "/payroll/pay-rates", icon: DollarSign },
                    { key: "payroll-work-reports", label: "Work Reports", to: "/payroll/work-reports", icon: ClipboardCheck },
                  ]
                : []),
              ...(isPayrollProcessor
                ? [{ key: "payroll-runs", label: "Payroll Runs", to: "/payroll/runs", icon: Landmark }]
                : []),
              ...(role === "Payroll"
                ? [{ key: "payroll-settings", label: "Payroll Settings", to: "/payroll/settings", icon: SettingsIcon }]
                : []),
            ],
          },
        ]
      : []),
  ];
}

export default function DashboardShell() {
  const { user, tenantSlug, logout } = useAuth();
  const role = user?.role;
  const isAdminOrHr = role === "Admin" || role === "HR";
  const [mode, setMode] = useDashboardMode();
  const [branding, setBranding] = useState<GeneralSettingsDto | null>(null);

  useEffect(() => {
    getGeneralSettings()
      .then((settings) => {
        setBranding(settings);
        applyBranding(settings);
      })
      .catch(() => undefined);
  }, []);

  const staffView = role === "Staff" || (isAdminOrHr && mode === "staff");
  const adminView = isAdminOrHr && mode === "admin";

  const groups: SidebarGroup[] = staffView
    ? buildStaffViewGroups()
    : adminView
      ? buildAdminViewGroups(role === "Admin")
      : buildDefaultViewGroups(role);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        header={<Logo size="sm" imageSrc={resolveFileUrl(branding?.logoUrl)} wordmark={branding?.siteTitle} />}
        groups={groups}
        footer={
          isAdminOrHr ? (
            <div className="flex rounded-md border border-slate-200 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setMode("staff")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 transition-colors ${
                  mode === "staff" ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <UserRound className="h-3.5 w-3.5" />
                Staff
              </button>
              <button
                type="button"
                onClick={() => setMode("admin")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 transition-colors ${
                  mode === "admin" ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin
              </button>
            </div>
          ) : undefined
        }
      />
      <div className="flex flex-1 flex-col">
        <Topbar
          userName={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()}
          userMeta={`${user?.role ?? ""} · ${tenantSlug ?? ""}`}
          onSignOut={logout}
        />
        <main className="flex-1 p-6">
          <Outlet context={{ dashboardMode: mode }} />
        </main>
      </div>
    </div>
  );
}
