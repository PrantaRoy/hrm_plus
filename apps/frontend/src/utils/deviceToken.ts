const STORAGE_KEY = "hrm-plus-device-token";

export function getDeviceToken(): string {
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const token = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, token);
  return token;
}
