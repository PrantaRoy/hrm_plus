import { FormEvent, useCallback, useEffect, useState } from "react";
import { COMMENT_STATUSES, CommentDto, CommentStatus } from "@hrm-plus/shared";
import { Badge, BadgeColor, Button, Card, Select, Textarea } from "@hrm-plus/ui";
import { useAuth } from "../../auth/AuthContext";
import { OwnerKind, createComment, deleteComment, listComments, updateComment } from "../../api/collaboration";
import { apiErrorMessage } from "../../utils/apiError";
import { formatDateTime, humanize } from "./format";

const STATUS_COLOR: Record<CommentStatus, BadgeColor> = {
  open: "amber",
  resolved: "green",
  considered: "brand",
  rejected: "red",
};

interface Props {
  kind: OwnerKind;
  ownerId: number;
  /** Supervisors/managers can set a review status and delete other people's comments. */
  canModerate: boolean;
}

export function CommentsPanel({ kind, ownerId, canModerate }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<CommentStatus | "">("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    listComments(kind, ownerId)
      .then(setComments)
      .catch((err) => setError(apiErrorMessage(err, "Failed to load comments")))
      .finally(() => setLoading(false));
  }, [kind, ownerId]);

  useEffect(load, [load]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createComment(kind, ownerId, { body: body.trim(), status: status || null });
      setComments((prev) => [...prev, created]);
      setBody("");
      setStatus("");
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to post comment"));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(comment: CommentDto, next: CommentStatus | "") {
    try {
      const updated = await updateComment(comment.id, { status: next || null });
      setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to update comment"));
    }
  }

  async function remove(comment: CommentDto) {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteComment(comment.id);
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to delete comment"));
    }
  }

  return (
    <Card title="Comments" description={`${comments.length} comment(s)`}>
      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}
      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <ul className="space-y-4 mb-5">
          {comments.length === 0 && <li className="text-sm text-slate-400">No comments yet.</li>}
          {comments.map((c) => {
            const isAuthor = c.author.userId === user?.id;
            return (
              <li key={c.id} className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">{c.author.name}</span>
                  <span className="text-xs text-slate-400">{formatDateTime(c.createdAt)}</span>
                  {c.status && !canModerate && <Badge color={STATUS_COLOR[c.status]}>{humanize(c.status)}</Badge>}
                  {canModerate && (
                    <Select
                      value={c.status ?? ""}
                      onChange={(e) => changeStatus(c, e.target.value as CommentStatus | "")}
                      className="!w-auto !py-0.5 !text-xs"
                      aria-label="Comment status"
                    >
                      <option value="">No status</option>
                      {COMMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {humanize(s)}
                        </option>
                      ))}
                    </Select>
                  )}
                  {(isAuthor || canModerate) && (
                    <button type="button" onClick={() => remove(c)} className="ml-auto text-xs text-red-600 hover:underline">
                      Delete
                    </button>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-slate-700">{c.body}</p>
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={submit} className="space-y-2">
        <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a comment…" />
        <div className="flex items-center justify-between gap-2">
          {canModerate ? (
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as CommentStatus | "")}
              className="!w-auto"
              aria-label="Initial status"
            >
              <option value="">No status</option>
              {COMMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {humanize(s)}
                </option>
              ))}
            </Select>
          ) : (
            <span />
          )}
          <Button type="submit" size="sm" isLoading={saving} disabled={!body.trim()}>
            Post comment
          </Button>
        </div>
      </form>
    </Card>
  );
}
