import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NotificationDto } from "@hrm-plus/shared";
import { cn, EmptyState, Spinner } from "@hrm-plus/ui";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "../../api/notifications";
import { timeAgo } from "../../utils/timeAgo";

interface NotificationDropdownProps {
  onClose: () => void;
  onUnreadCountChange: Dispatch<SetStateAction<number>>;
}

export function NotificationDropdown({ onClose, onUnreadCountChange }: NotificationDropdownProps) {
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listNotifications({ pageSize: 10 })
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false));
  }, []);

  async function handleClick(notification: NotificationDto) {
    if (notification.status === "Unread") {
      try {
        await markNotificationRead(notification.id);
        setItems((prev) => prev.map((n) => (n.id === notification.id ? { ...n, status: "Read" } : n)));
        onUnreadCountChange((count) => Math.max(0, count - 1));
      } catch {
        // ignore — still navigate
      }
    }
    onClose();
    if (notification.targetUrl) {
      navigate(notification.targetUrl);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, status: "Read" })));
      onUnreadCountChange(0);
    } catch {
      // ignore
    }
  }

  return (
    <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <span className="text-sm font-semibold text-slate-800">Notifications</span>
        <button type="button" onClick={handleMarkAllRead} className="text-xs text-brand-600 hover:underline">
          Mark all as read
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className="px-4 py-6">
            <EmptyState title="No notifications" description="You're all caught up." />
          </div>
        )}
        {!loading &&
          items.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleClick(notification)}
              className={cn(
                "flex w-full flex-col gap-0.5 border-b border-slate-50 px-4 py-2.5 text-left last:border-b-0 hover:bg-slate-50",
                notification.status === "Unread" && "bg-brand-50/50"
              )}
            >
              <span className={cn("text-sm text-slate-800", notification.status === "Unread" && "font-semibold")}>
                {notification.title}
              </span>
              <span className="text-xs text-slate-400">{timeAgo(notification.createdAt)}</span>
            </button>
          ))}
      </div>
      <div className="border-t border-slate-100 px-4 py-2.5 text-center">
        <button
          type="button"
          onClick={() => {
            onClose();
            navigate("/notifications");
          }}
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          View all
        </button>
      </div>
    </div>
  );
}
