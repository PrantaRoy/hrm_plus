const RESERVED_SUBDOMAINS = new Set(["www", "app", "admin", "api"]);

export function extractTenantSlug(hostname: string, baseDomain: string): string | null {
  const host = hostname.split(":")[0].toLowerCase();
  const suffix = `.${baseDomain.toLowerCase()}`;
  if (!host.endsWith(suffix)) return null;
  const slug = host.slice(0, -suffix.length);
  if (!slug || slug.includes(".") || RESERVED_SUBDOMAINS.has(slug)) return null;
  return slug;
}
