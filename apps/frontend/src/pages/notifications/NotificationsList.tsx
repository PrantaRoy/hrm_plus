import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NotificationDto, PaginatedResult } from "@hrm-plus/shared";
import { Button, cn, EmptyState, PageHeader, Spinner } from "@hrm-plus/ui";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "../../api/notifications";
import { timeAgo } from "../../utils/timeAgo";

const PAGE_SIZE = 20;

export default function NotificationsList() {
  const navigate = useNavigate();
  const [result, setResult] = useState<PaginatedResult<NotificationDto> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listNotifications({ page, pageSize: PAGE_SIZE })
      .then((res) => {
        if (!cancelled) setResult(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  async function handleClick(notification: NotificationDto) {
    if (notification.status === "Unread") {
      try {
        await markNotificationRead(notification.id);
        setResult((prev) =>
          prev
            ? { ...prev, items: prev.items.map((n) => (n.id === notification.id ? { ...n, status: "Read" } : n)) }
            : prev
        );
      } catch {
        // ignore — still navigate
      }
    }
    if (notification.targetUrl) {
      navigate(notification.targetUrl);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setResult((prev) => (prev ? { ...prev, items: prev.items.map((n) => ({ ...n, status: "Read" })) } : prev));
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description="Everything that's happened, most recent first."
        actions={
          <Button variant="secondary" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        }
      />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}
        {!loading && result?.items.length === 0 && (
          <div className="py-10">
            <EmptyState title="No notifications" description="You're all caught up." />
          </div>
        )}
        {!loading &&
          result?.items.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleClick(notification)}
              className={cn(
                "flex w-full items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5 text-left last:border-b-0 hover:bg-slate-50",
                notification.status === "Unread" && "bg-brand-50/50"
              )}
            >
              <span className={cn("text-sm text-slate-800", notification.status === "Unread" && "font-semibold")}>
                {notification.title}
              </span>
              <span className="shrink-0 text-xs text-slate-400">{timeAgo(notification.createdAt)}</span>
            </button>
          ))}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{result?.total ?? 0} total notifications</span>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
