import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import {
  BASE_URL,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api";
import { useAuth } from "../hooks/useAuth";

const NotificationContext = createContext(null);

const sortNotifications = (list = []) =>
  [...list].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1; // unread first
    const ta = Date.parse(a.createdAt || 0);
    const tb = Date.parse(b.createdAt || 0);
    return (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta);
  });

export function NotificationProvider({ children }) {
  const { auth, isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const clientRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!isLoggedIn) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getNotifications(auth);
      setNotifications(sortNotifications(Array.isArray(data) ? data : []));
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [auth, isLoggedIn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isLoggedIn) {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`${BASE_URL}/ws`),
      reconnectDelay: 5000,
      connectHeaders: auth?.token
        ? { Authorization: `Bearer ${auth.token}` }
        : undefined,
      onConnect: () => {
        client.subscribe("/topic/notifications", (message) => {
          try {
            const payload = JSON.parse(message.body);
            setNotifications((prev) => sortNotifications([payload, ...prev]));
          } catch (e) {
            console.error("Failed to parse notification payload", e);
          }
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [auth, isLoggedIn]);

  const markAsRead = useCallback(
    async (id) => {
      setNotifications((prev) =>
        sortNotifications(prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      );
      try {
        await markNotificationRead(id, auth);
      } catch {
        refresh();
      }
    },
    [auth, refresh]
  );

  const markAllAsReadLocal = useCallback(() => {
    setNotifications((prev) => sortNotifications(prev.map((n) => ({ ...n, read: true }))));
  }, []);

  const markAll = useCallback(async () => {
    markAllAsReadLocal();
    try {
      await markAllNotificationsRead(auth);
    } catch {
      refresh();
    }
  }, [auth, markAllAsReadLocal, refresh]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAllAsRead: markAll,
      refresh,
    }),
    [notifications, unreadCount, loading, markAsRead, markAll, refresh]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}
