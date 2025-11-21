import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../contexts/NotificationContext";

const prettyTime = (ts) => {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};

export default function NotificationBell() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const latest = useMemo(() => notifications.slice(0, 6), [notifications]);

  useEffect(() => {
    function onClick(e) {
      if (!open) return;
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="navbar-link relative flex items-center gap-2 transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <span aria-hidden>🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-2 min-w-[18px] px-1 h-[18px] rounded-full bg-amber-500 text-[10px] font-semibold text-white flex items-center justify-center leading-none shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 max-h-[24rem] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b divider">
            <div className="font-semibold text-sm">Notifications</div>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={markAllAsRead}
                className="text-[var(--accent)] hover:underline disabled:opacity-60"
                disabled={unreadCount === 0}
              >
                Mark all
              </button>
              <Link
                to="/notifications"
                className="text-[var(--accent)] hover:underline"
                onClick={() => setOpen(false)}
              >
                View all
              </Link>
            </div>
          </div>

          <div className="max-h-[19rem] overflow-y-auto">
            {loading && (
              <div className="p-4 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]"
                  />
                ))}
              </div>
            )}

            {!loading && latest.length === 0 && (
              <div className="p-4 text-sm section-meta">No notifications yet.</div>
            )}

            {!loading &&
              latest.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b divider last:border-0 ${
                    n.read ? "opacity-75" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!n.read && (
                      <span className="mt-1 inline-block h-2 w-2 rounded-full bg-amber-500" />
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="text-sm leading-5">{n.message}</div>
                      <div className="text-[11px] section-meta flex items-center gap-2">
                        {n.orderId && <span className="chip text-[10px] py-1">#{n.orderId}</span>}
                        <span>{prettyTime(n.createdAt)}</span>
                      </div>
                    </div>
                    {!n.read && (
                      <button
                        className="text-xs text-[var(--accent)] hover:underline"
                        onClick={() => markAsRead(n.id)}
                      >
                        Mark
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
