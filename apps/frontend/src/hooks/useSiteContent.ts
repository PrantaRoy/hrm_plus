import { useQuery } from "@tanstack/react-query";
import { fetchPublicSiteContent } from "../api/publicSiteContent";

export function useSiteContent(tenantSlug: string | undefined) {
  return useQuery({
    queryKey: ["site-content", tenantSlug],
    queryFn: () => fetchPublicSiteContent(tenantSlug as string),
    enabled: Boolean(tenantSlug),
    staleTime: 60_000,
  });
}
