import { useParams } from "react-router-dom";
import { useTenantSubdomain } from "./useTenantSubdomain";

export function useResolvedTenantSlug(): string | undefined {
  const { tenantSlug: paramSlug } = useParams<{ tenantSlug?: string }>();
  const subdomainSlug = useTenantSubdomain();
  // No subdomain to resolve from (e.g. a bare-IP deployment with no domain at all) — fall back to
  // the single configured demo tenant, same as Login.tsx already does for its tenant field.
  const defaultSlug = import.meta.env.VITE_DEFAULT_TENANT_SLUG || undefined;
  return paramSlug ?? subdomainSlug ?? defaultSlug;
}
