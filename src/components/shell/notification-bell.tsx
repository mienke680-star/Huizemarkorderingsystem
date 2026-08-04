"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { NOTIFICATION_LABELS, type NotificationType } from "@/lib/constants";
import { timeAgo, cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
  orderId: string | null;
  order: { orderNumber: string } | null;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await fetch("/api/notifications/read-all", { method: "POST" });
  }

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    });
  }

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((v) => !v)}
        className="relative flex size-10 items-center justify-center rounded-full text-navy-600 transition-colors hover:bg-grey-100"
        aria-label="Notifications"
      >
        <motion.span
          animate={unreadCount > 0 ? { rotate: [0, -12, 10, -8, 0] } : {}}
          transition={{ duration: 0.6, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 4 }}
        >
          <Bell className="size-5" />
        </motion.span>
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1 right-1.5 flex size-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 z-40 mt-2 w-96 overflow-hidden rounded-2xl border border-grey-100 bg-white shadow-soft-lg"
          >
            <div className="flex items-center justify-between border-b border-grey-100 px-4 py-3">
              <span className="font-display text-sm font-semibold text-navy-800">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
                >
                  <CheckCheck className="size-3.5" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="space-y-2 p-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="skeleton h-14 rounded-xl" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <p className="p-6 text-center text-sm text-grey-400">You&apos;re all caught up.</p>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.orderId ? `/orders/${n.orderId}` : "/notifications"}
                    onClick={() => !n.read && markRead(n.id)}
                    className={cn(
                      "flex gap-3 border-b border-grey-50 px-4 py-3 transition-colors last:border-b-0 hover:bg-grey-50",
                      !n.read && "bg-orange-50/50"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        n.read ? "bg-grey-200" : "bg-orange-500 animate-pulse-soft"
                      )}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-navy-800">{n.title}</p>
                      {n.body && <p className="line-clamp-2 text-xs text-grey-500">{n.body}</p>}
                      <p className="mt-0.5 text-[11px] text-grey-400">
                        {NOTIFICATION_LABELS[n.type as NotificationType] ?? n.type} · {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-grey-100 px-4 py-3 text-center text-xs font-semibold text-orange-600 hover:bg-orange-50"
            >
              View all notifications
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
