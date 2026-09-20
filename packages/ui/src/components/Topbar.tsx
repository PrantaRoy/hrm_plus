import { ReactNode } from "react";
import { LogOut, Menu } from "lucide-react";
import { Avatar } from "./Avatar";
import { cn } from "../cn";

export interface TopbarProps {
  title?: ReactNode;
  userName: string;
  userMeta?: ReactNode;
  onSignOut: () => void;
  /** Shows a hamburger button (< lg) that opens the sidebar drawer. */
  onMenuClick?: () => void;
  /** Extra controls rendered before the user block (search, notifications, ...). */
  actions?: ReactNode;
  className?: string;
}

export function Topbar({ title, userName, userMeta, onSignOut, onMenuClick, actions, className }: TopbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur sm:px-6 lg:px-8",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="-ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        {title && <div className="truncate text-sm font-semibold text-slate-800">{title}</div>}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {actions}
        <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-card">
          <Avatar name={userName} size="sm" />
          <div className="hidden text-sm leading-tight sm:block">
            <p className="max-w-[10rem] truncate font-medium text-slate-900">{userName}</p>
            {userMeta && <p className="max-w-[10rem] truncate text-[11px] text-slate-500">{userMeta}</p>}
          </div>
        </div>
        <button
          onClick={onSignOut}
          title="Sign out"
          aria-label="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
