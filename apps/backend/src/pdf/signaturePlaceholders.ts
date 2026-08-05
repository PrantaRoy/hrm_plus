import path from "node:path";
import { getStorageDriver } from "../storage";

export interface ResolvedApprovalSignature {
  approverType: string; // "ReportingManager" | "Role"
  roleName: string | null;
  signatureImageKey: string | null;
}

function tokenKeyFor(signature: ResolvedApprovalSignature): string {
  return signature.approverType === "ReportingManager" ? "ReportingManager" : signature.roleName ?? "";
}

// Signature uploads only accept PNG/WebP (see middleware/fileUpload.ts's signatureUpload),
// so the extension on the stored key is enough to reconstruct the mime type.
const MIME_BY_EXT: Record<string, string> = { ".png": "image/png", ".webp": "image/webp" };

async function toDataUri(key: string): Promise<string> {
  const buffer = await getStorageDriver().read(key);
  const mimeType = MIME_BY_EXT[path.extname(key).toLowerCase()] ?? "image/png";
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

/**
 * Replaces `{{signature:<ApproverTypeOrRoleName>}}` tokens with an <img> tag pointing
 * at the deciding approver's stored signature image (as a base64 data URI, so the
 * Puppeteer render doesn't depend on an externally reachable URL). A step with no
 * matching signature (not yet decided, or the approver never uploaded one) resolves
 * to an empty string rather than a broken image.
 */
export async function injectSignatures(html: string, signatures: ResolvedApprovalSignature[]): Promise<string> {
  const dataUriByKey = new Map<string, string>();
  for (const signature of signatures) {
    if (!signature.signatureImageKey) continue;
    const key = tokenKeyFor(signature);
    if (!key || dataUriByKey.has(key)) continue;
    dataUriByKey.set(key, await toDataUri(signature.signatureImageKey));
  }

  return html.replace(/\{\{\s*signature:\s*([^}]+?)\s*\}\}/g, (_match, key: string) => {
    const dataUri = dataUriByKey.get(key.trim());
    if (!dataUri) return "";
    return `<img src="${dataUri}" alt="signature" style="max-height:60px;max-width:220px;object-fit:contain;" />`;
  });
}
