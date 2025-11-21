import { useMemo } from "react";
import { useNotifications } from "../contexts/NotificationContext";
import { useAuth } from "../hooks/useAuth";

const formatDateTime = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
};

export default function NotificationsPage() {
  const { isLoggedIn } = useAuth();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh } =
    useNotifications();

  const hasItems = useMemo(() => (notifications || []).length > 0, [notifications]);

  if (!isLoggedIn) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="token-card p-6 text-center section-meta">
          Please log in to view notifications.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm section-meta">
            Stay updated about new orders in real time.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <button
            className="btn btn-secondary text-sm"
            onClick={refresh}
            disabled={loading}
          >
            Refresh
          </button>
          <button
            className="btn btn-primary text-sm disabled:opacity-60"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all read
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-3" aria-label="Loading notifications">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]"
            />
          ))}
        </div>
      )}

      {!loading && !hasItems && (
        <div className="token-card p-6 text-center section-meta">
          No notifications yet.
        </div>
      )}

      {!loading && hasItems && (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`token-card p-4 flex items-start justify-between gap-3 ${
                n.read ? "opacity-75" : ""
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {!n.read && (
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
                  )}
                  <div className="font-medium">{n.message}</div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs section-meta">
                  {n.orderId && (
                    <span className="chip text-[11px] py-1">Order #{n.orderId}</span>
                  )}
                  <span>{formatDateTime(n.createdAt)}</span>
                </div>
              </div>

              {!n.read && (
                <button
                  className="btn btn-secondary text-xs whitespace-nowrap"
                  onClick={() => markAsRead(n.id)}
                >
                  Mark as read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
