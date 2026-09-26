import { ComponentType, ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import { cn } from "../cn";
import { Badge } from "./Badge";

export interface SidebarNavItem {
  key: string;
  label: string;
  to: string;
  icon?: ComponentType<{ className?: string }>;
  end?: boolean;
  /** Short pill text (e.g. "AI") shown after the label to call out a flagship feature. */
  badge?: string;
  /** Subtle gradient/glow treatment to make this item stand out from its siblings. */
  highlight?: boolean;
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
  /** Mobile drawer state. On >= lg the sidebar is always visible. */
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ header, groups, footer, className, open = false, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[1px] lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200",
          "lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        {header && (
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-5">
            {header}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-hover hover:text-white lg:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" onClick={onClose}>
          {groups.map((group, index) => (
            <div key={group.label ?? index} className="space-y-0.5">
              {group.label && (
                <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted/70">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => (
                <SidebarItem key={item.key} item={item} />
              ))}
            </div>
          ))}
        </nav>
        {footer && <div className="shrink-0 border-t border-sidebar-border p-3">{footer}</div>}
      </aside>
    </>
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
          "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? cn("bg-white/10 text-white", item.highlight && "shadow-glow")
            : cn(
                "text-sidebar-muted hover:bg-sidebar-hover hover:text-white",
                item.highlight && "bg-gradient-to-r from-accent-500/10 to-accent-400/5 ring-1 ring-inset ring-accent-400/20"
              )
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-brand-400" aria-hidden="true" />
          )}
          {Icon && (
            <Icon
              className={cn(
                "h-[18px] w-[18px] shrink-0 transition-colors",
                isActive ? "text-brand-300" : "text-sidebar-muted group-hover:text-white"
              )}
            />
          )}
          <span className="truncate">{item.label}</span>
          {item.badge && (
            <Badge
              color="brand"
              className="ml-auto shrink-0 !px-1.5 !py-0 bg-ai-gradient text-[10px] font-semibold uppercase tracking-wide text-white ring-0"
            >
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </NavLink>
  );
}
