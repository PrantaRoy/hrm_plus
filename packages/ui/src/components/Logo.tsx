import { cn } from "../cn";

export interface LogoProps {
  markOnly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  wordmarkClassName?: string;
  /** Custom uploaded logo image URL — replaces the default inline SVG mark when set. */
  imageSrc?: string | null;
  /** Custom site title — replaces the default "HRM Plus" wordmark when set. */
  wordmark?: string;
  /** "light" renders the wordmark in white for dark backgrounds (e.g. the sidebar). */
  tone?: "dark" | "light";
}

const markSizes = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-12 w-12",
};

const wordmarkSizes = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
};

export function Logo({
  markOnly = false,
  size = "md",
  className,
  wordmarkClassName,
  imageSrc,
  wordmark,
  tone = "dark",
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {imageSrc ? (
        <img src={imageSrc} alt={wordmark ?? "Logo"} className={cn(markSizes[size], "shrink-0 object-contain")} />
      ) : (
        <svg
          viewBox="0 0 32 32"
          className={cn(markSizes[size], "shrink-0")}
          aria-hidden="true"
        >
          <rect width="32" height="32" rx="9" className={tone === "light" ? "fill-brand-500" : "fill-brand-600"} />
          <path
            d="M10 9v14M22 9v14M10 16h12"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      )}
      {!markOnly && (
        <span
          className={cn(
            "font-bold tracking-tight",
            tone === "light" ? "text-white" : "text-slate-900",
            wordmarkSizes[size],
            wordmarkClassName
          )}
        >
          {wordmark ?? "HRM Plus"}
        </span>
      )}
    </div>
  );
}
