"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { AppNotification } from "@/types";
import { initialNotifications } from "@/data/notifications";

type Ctx = {
  notifications: AppNotification[];
  unread: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  push: (n: Omit<AppNotification, "id" | "read">) => void;
};

const NotificationsContext = createContext<Ctx | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);

  const markRead = useCallback((id: string) => setNotifications((l) => l.map((n) => (n.id === id ? { ...n, read: true } : n))), []);
  const markAllRead = useCallback(() => setNotifications((l) => l.map((n) => ({ ...n, read: true }))), []);
  const push = useCallback(
    (n: Omit<AppNotification, "id" | "read">) =>
      setNotifications((l) => [{ ...n, id: `n-${l.length + 1}-${n.at}`, read: false }, ...l]),
    []
  );

  const value = useMemo(
    () => ({ notifications, unread: notifications.filter((n) => !n.read).length, markRead, markAllRead, push }),
    [notifications, markRead, markAllRead, push]
  );
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
}
