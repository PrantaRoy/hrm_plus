import { AuthUser } from "@hrm-plus/shared";

export interface Session {
  token: string;
  user: AuthUser;
  tenantSlug: string;
}

const STORAGE_KEY = "hrm-plus-session";

let session: Session | null = readFromStorage();
const listeners = new Set<() => void>();

function readFromStorage(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function getSession(): Session | null {
  return session;
}

export function setSession(next: Session): void {
  session = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

export function clearSession(): void {
  session = null;
  localStorage.removeItem(STORAGE_KEY);
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
