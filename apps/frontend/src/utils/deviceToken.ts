const STORAGE_KEY = "hrm-plus-device-token";

// crypto.randomUUID() is spec'd to work only in a "secure context" (HTTPS or localhost) — on a
// plain-HTTP deployment (e.g. a bare EC2 IP with no TLS) it's undefined and throws, which used to
// crash this whole widget. crypto.getRandomValues() has no such restriction, so it's used as the
// fallback; this token only identifies a device locally, it isn't a security credential.
function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
    return [
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10, 16).join(""),
    ].join("-");
  }
  // Last resort for an environment with no Web Crypto API at all; not cryptographically strong,
  // but adequate for a local device-identification token.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceToken(): string {
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const token = generateUuid();
  window.localStorage.setItem(STORAGE_KEY, token);
  return token;
}
