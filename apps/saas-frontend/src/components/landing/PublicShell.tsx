import { ReactNode } from "react";
import { PublicSaasSiteSettingsDto } from "@hrm-plus/shared";
import { LandingNavbar } from "./LandingNavbar";
import { LandingFooter } from "./LandingFooter";

export function PublicShell({
  settings,
  children,
}: {
  settings: PublicSaasSiteSettingsDto;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <LandingNavbar settings={settings} />
      <main className="flex-1">{children}</main>
      <LandingFooter settings={settings} />
    </div>
  );
}
