/**
 * Flat {{token}} substitution for document templates. Tokens are dotted paths into
 * `data` (e.g. "employee.firstName") except the "signature:" prefix, which is
 * resolved separately by signaturePlaceholders.ts before this runs. No conditionals
 * or loops are supported — the source templates don't need them (see plan §3.1).
 */
export function renderTemplate(html: string, data: Record<string, unknown>): string {
  return html.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, expression: string) => {
    if (expression.startsWith("signature:")) {
      return match; // left for signaturePlaceholders.ts to resolve
    }
    const value = resolvePath(data, expression);
    return value === undefined || value === null ? "" : String(value);
  });
}

function resolvePath(data: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, data);
}
