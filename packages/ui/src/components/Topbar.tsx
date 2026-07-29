import { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { Avatar } from "./Avatar";
import { cn } from "../cn";

export interface TopbarProps {
  title?: ReactNode;
  userName: string;
  userMeta?: ReactNode;
  onSignOut: () => void;
  className?: string;
}

export function Topbar({ title, userName, userMeta, onSignOut, className }: TopbarProps) {
  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6",
        className
      )}
    >
      <div className="text-sm font-medium text-slate-900">{title}</div>
      <div className="flex items-center gap-3">
        <Avatar name={userName} size="sm" />
        <div className="text-sm leading-tight">
          <p className="font-medium text-slate-900">{userName}</p>
          {userMeta && <p className="text-xs text-slate-400">{userMeta}</p>}
        </div>
        <button
          onClick={onSignOut}
          title="Sign out"
          className="ml-2 flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
