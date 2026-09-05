const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:4000";

/**
 * Resolves a stored file path to an absolute URL. Local-storage uploads come back
 * as "/uploads/..." and need the API origin prepended; S3 uploads are already
 * absolute and pass through unchanged.
 */
export function resolveFileUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
}
