export interface BlobShapeProps {
  // "secondary" uses the tenant's secondary brand color so decorative accents
  // stay fully dynamic rather than a hardcoded flourish color; "white" is for
  // use on the fixed dark navy panel where a tenant-colored blob would clash.
  tone?: "primary" | "secondary" | "white";
  className?: string;
}

const FILL_BY_TONE: Record<NonNullable<BlobShapeProps["tone"]>, string> = {
  primary: "var(--brand-primary)",
  secondary: "var(--brand-secondary)",
  white: "#ffffff",
};

export function BlobShape({ tone = "primary", className }: BlobShapeProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <path
        fill={FILL_BY_TONE[tone]}
        d="M60,15 C95,5 140,20 165,55 C190,90 185,140 150,165 C115,190 65,185 35,155 C5,125 0,75 25,45 C40,27 45,22 60,15 Z"
      />
    </svg>
  );
}
