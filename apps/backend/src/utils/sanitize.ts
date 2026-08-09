import sanitizeHtml from "sanitize-html";

// Strips all markup from user-submitted public-form text fields, keeping plain text only.
export function stripHtml(value: string): string {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}
