import { SaasAdminUser } from "@hrm-plus/shared";

export interface SaasSession {
  token: string;
  admin: SaasAdminUser;
}

const STORAGE_KEY = "hrm-plus-saas-session";

let session: SaasSession | null = readFromStorage();
const listeners = new Set<() => void>();

function readFromStorage(): SaasSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SaasSession;
  } catch {
    return null;
  }
}

export function getSession(): SaasSession | null {
  return session;
}

export function setSession(next: SaasSession): void {
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
