import { useMemo } from "react";
import { extractTenantSlug } from "@hrm-plus/shared";

const BASE_DOMAIN = import.meta.env.VITE_PUBLIC_TENANT_BASE_DOMAIN ?? "hrmplus.test";

export function useTenantSubdomain(): string | null {
  return useMemo(() => extractTenantSlug(window.location.hostname, BASE_DOMAIN), []);
}
