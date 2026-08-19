import { ReactNode } from "react";
import { PILL_BADGE } from "./publicSiteClasses";

export interface PillBadgeProps {
  icon?: ReactNode;
  children: ReactNode;
}

export function PillBadge({ icon, children }: PillBadgeProps) {
  return (
    <span className={PILL_BADGE}>
      {icon}
      {children}
    </span>
  );
}
