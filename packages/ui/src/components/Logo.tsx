import { cn } from "../cn";

export interface LogoProps {
  markOnly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  wordmarkClassName?: string;
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

export function Logo({ markOnly = false, size = "md", className, wordmarkClassName }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 32 32"
        className={cn(markSizes[size], "shrink-0")}
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="9" className="fill-brand-600" />
        <path
          d="M10 9v14M22 9v14M10 16h12"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {!markOnly && (
        <span className={cn("font-bold tracking-tight text-slate-900", wordmarkSizes[size], wordmarkClassName)}>
          HRM Plus
        </span>
      )}
    </div>
  );
}
