import { useParams } from "react-router-dom";
import { useTenantSubdomain } from "./useTenantSubdomain";

export function useResolvedTenantSlug(): string | undefined {
  const { tenantSlug: paramSlug } = useParams<{ tenantSlug?: string }>();
  const subdomainSlug = useTenantSubdomain();
  return paramSlug ?? subdomainSlug ?? undefined;
}
