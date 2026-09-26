import { ComponentType, useState } from "react";
import { Link } from "react-router-dom";
import { ListChecks, Sparkles, X } from "lucide-react";

interface FabFeature {
  id: string;
  label: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
}

const FEATURES: FabFeature[] = [
  { id: "ai-kpi-report", label: "AI KPI Report", to: "/ai-kpi-report", icon: Sparkles },
  { id: "screening-questions", label: "Screening Questions", to: "/screening-questions", icon: ListChecks },
];

function storageKey(id: string) {
  return `hrm-plus-ai-fab-minimized-${id}`;
}

function readMinimized(id: string): boolean {
  try {
    return localStorage.getItem(storageKey(id)) === "1";
  } catch {
    return false;
  }
}

function writeMinimized(id: string, value: boolean) {
  try {
    localStorage.setItem(storageKey(id), value ? "1" : "0");
  } catch {
    // ignore write failures (private browsing, storage disabled, etc.)
  }
}

function Fab({ feature }: { feature: FabFeature }) {
  const [minimized, setMinimized] = useState(() => readMinimized(feature.id));
  const Icon = feature.icon;

  function minimize() {
    setMinimized(true);
    writeMinimized(feature.id, true);
  }

  if (minimized) {
    return (
      <Link
        to={feature.to}
        title={feature.label}
        aria-label={feature.label}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-ai-gradient text-white shadow-fab transition-transform hover:scale-105"
      >
        <Icon className="h-5 w-5" />
      </Link>
    );
  }

  return (
    <div className="relative">
      <Link
        to={feature.to}
        className="flex items-center gap-2 rounded-full bg-ai-gradient px-4 py-2.5 text-sm font-medium text-white shadow-fab transition-transform hover:scale-[1.03]"
      >
        <Icon className="h-4 w-4" />
        {feature.label}
      </Link>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          minimize();
        }}
        aria-label={`Minimize ${feature.label} shortcut`}
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white shadow-card hover:bg-slate-700"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function AiFeatureFabs() {
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {FEATURES.map((feature) => (
        <Fab key={feature.id} feature={feature} />
      ))}
    </div>
  );
}
