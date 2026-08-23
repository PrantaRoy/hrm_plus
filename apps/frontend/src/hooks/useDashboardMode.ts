import { useState } from "react";

export type DashboardMode = "staff" | "admin";

const STORAGE_KEY = "hrm-plus-dashboard-mode";

function readStoredMode(): DashboardMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "staff" ? "staff" : "admin";
  } catch {
    return "admin";
  }
}

export function useDashboardMode(): [DashboardMode, (mode: DashboardMode) => void] {
  const [mode, setModeState] = useState<DashboardMode>(readStoredMode);

  function setMode(next: DashboardMode) {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore write failures (private browsing, storage disabled, etc.)
    }
  }

  return [mode, setMode];
}
