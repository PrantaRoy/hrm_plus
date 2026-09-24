import { createQrKioskSession } from "../api/attendance";

const SESSION_STORAGE_KEY = "attendance-qr-kiosk-session-id";

// The office's kiosk display and its "print a permanent QR" page both operate on the
// same physical kiosk/location, so they share one AttendanceQrSession row (persisted in
// localStorage) instead of creating a new one every time either page loads.
export async function getOrCreateKioskSessionId(): Promise<number> {
  const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (stored) return Number(stored);

  const created = await createQrKioskSession({ label: "Office Kiosk" });
  window.localStorage.setItem(SESSION_STORAGE_KEY, String(created.id));
  return created.id;
}
