// Validated via the dataviz skill's palette validator (scripts/validate_palette.js).
// The app's own badge colors (green-700/amber-700/red-700/slate-600) fail as a
// categorical palette (red vs amber normal-vision ΔE 9.1, below the 15 floor), so
// these charts use the skill's own status palette instead — a better semantic fit
// anyway, since every series here *is* a status (present/absent/late, leave status).
// "warning" sits below 3:1 contrast on a light surface by the palette's own design;
// the mitigation is that it is never rendered without a paired text label.
export const chartColors = {
  good: "#0ca30c", // present, approved
  warning: "#fab219", // late, pending
  critical: "#d03b3b", // absent, rejected
  muted: "#898781", // on leave, cancelled
  gridline: "#e1e0d9",
  axis: "#c3c2b7",
  textSecondary: "#52514e",
  textPrimary: "#0b0b0b",
} as const;

// Single-hue sequential ramp (light -> dark blue) for the tenant duty-count heatmap.
export const sequentialBlue = ["#cde2fb", "#9ec5f4", "#5598e7", "#2a78d6", "#0d366b"] as const;

export function sequentialStep(value: number, max: number): string {
  if (max <= 0) return sequentialBlue[0];
  const ratio = Math.min(1, Math.max(0, value / max));
  const idx = Math.min(sequentialBlue.length - 1, Math.round(ratio * (sequentialBlue.length - 1)));
  return sequentialBlue[idx];
}
