// Plain className string constants for public-site CTAs. @hrm-plus/ui's Button
// hardcodes bg-brand-600 and cn() is a plain join (not tailwind-merge), so a
// caller className override isn't guaranteed to win — these bypass that
// component entirely and reference the tenant's --brand-primary CSS var directly.

export const PILL_BUTTON_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95";

export const PILL_BUTTON_OUTLINE =
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary)]/10";

export const EYEBROW_LABEL = "text-xs font-bold uppercase tracking-widest text-[var(--brand-primary)]";

export const PILL_BADGE =
  "inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm";
