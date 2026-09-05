import { ReactNode } from "react";
import { Link } from "react-router-dom";

/** Renders an internal route as <Link> and anything else (anchors, external URLs) as <a>. */
export function NavHref({
  href,
  children,
  className,
  onClick,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <Link to={href} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
