import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import { AttachmentDto } from "@hrm-plus/shared";
import { Button, Card } from "@hrm-plus/ui";
import { useAuth } from "../../auth/AuthContext";
import {
  OwnerKind,
  deleteAttachment,
  listAttachments,
  uploadAttachment,
} from "../../api/collaboration";
import { apiErrorMessage } from "../../utils/apiError";
import { resolveFileUrl } from "../../utils/fileUrl";
import { formatBytes, formatDateTime } from "./format";

interface Props {
  kind: OwnerKind;
  ownerId: number;
  /** Supervisors/managers can delete other people's files. */
  canModerate: boolean;
}

export function AttachmentsPanel({ kind, ownerId, canModerate }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<AttachmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    listAttachments(kind, ownerId)
      .then(setItems)
      .catch((err) => setError(apiErrorMessage(err, "Failed to load attachments")))
      .finally(() => setLoading(false));
  }, [kind, ownerId]);

  useEffect(load, [load]);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const created = await uploadAttachment(kind, ownerId, file);
      setItems((prev) => [...prev, created]);
    } catch (err) {
      setError(apiErrorMessage(err, "Upload failed (allowed: images, PDF, Word, Excel, CSV, text up to 10 MB)"));
    } finally {
      setUploading(false);
    }
  }

  async function remove(item: AttachmentDto) {
    if (!window.confirm(`Delete "${item.fileName}"?`)) return;
    try {
      await deleteAttachment(item.id);
      setItems((prev) => prev.filter((a) => a.id !== item.id));
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to delete attachment"));
    }
  }

  return (
    <Card
      title="Attachments"
      description={`${items.length} file(s)`}
      actions={
        <>
          <input ref={inputRef} type="file" className="hidden" onChange={onFile} />
          <Button size="sm" variant="secondary" isLoading={uploading} onClick={() => inputRef.current?.click()}>
            <Paperclip className="h-3.5 w-3.5" />
            Upload
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}
      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400">No attachments yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-2 text-sm">
              <a
                href={resolveFileUrl(a.fileUrl) ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="text-brand-700 hover:underline truncate"
              >
                {a.fileName}
              </a>
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {formatBytes(a.fileSize)} · {a.uploader.name} · {formatDateTime(a.createdAt)}
              </span>
              {(a.uploader.userId === user?.id || canModerate) && (
                <button type="button" onClick={() => remove(a)} className="ml-auto text-xs text-red-600 hover:underline">
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
