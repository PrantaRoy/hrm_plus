import { ComponentType, ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "../cn";

export interface SidebarNavItem {
  key: string;
  label: string;
  to: string;
  icon?: ComponentType<{ className?: string }>;
  end?: boolean;
}

export interface SidebarGroup {
  label?: string;
  items: SidebarNavItem[];
}

export interface SidebarProps {
  header?: ReactNode;
  groups: SidebarGroup[];
  footer?: ReactNode;
  className?: string;
}

export function Sidebar({ header, groups, footer, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white",
        className
      )}
    >
      {header && <div className="flex h-16 items-center px-5 border-b border-slate-100">{header}</div>}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {groups.map((group, index) => (
          <div key={group.label ?? index} className="space-y-1">
            {group.label && (
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {group.label}
              </p>
            )}
            {group.items.map((item) => (
              <SidebarItem key={item.key} item={item} />
            ))}
          </div>
        ))}
      </nav>
      {footer && <div className="border-t border-slate-100 p-3">{footer}</div>}
    </aside>
  );
}

export function SidebarItem({ item }: { item: SidebarNavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )
      }
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      {item.label}
    </NavLink>
  );
}
