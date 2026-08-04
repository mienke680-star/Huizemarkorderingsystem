"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CheckCheck, Bell, Mail, MessageCircle, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NOTIFICATION_LABELS, NOTIFICATION_TYPES, type NotificationType } from "@/lib/constants";
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

const PREFS_KEY = "hm-notification-prefs";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});

  async function load() {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const stored = window.localStorage.getItem(PREFS_KEY);
    if (stored) setPrefs(JSON.parse(stored));
    else {
      const initial: Record<string, boolean> = {};
      for (const t of NOTIFICATION_TYPES) initial[t] = true;
      setPrefs(initial);
    }
  }, []);

  function togglePref(type: string) {
    const next = { ...prefs, [type]: !prefs[type] };
    setPrefs(next);
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications/read-all", { method: "POST" });
    toast.success("All notifications marked as read");
  }

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    });
  }

  const visible = tab === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-orange-600">Notifications</p>
          <h1 className="font-display text-2xl font-semibold text-navy-800 sm:text-3xl">Notification Centre</h1>
          <p className="mt-1 text-sm text-grey-500">Stay on top of every order update.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead}>
            <CheckCheck className="size-4" /> Mark all read
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex overflow-hidden rounded-xl border border-grey-200 w-fit">
            <button
              onClick={() => setTab("all")}
              className={cn("px-4 py-2 text-sm font-medium", tab === "all" ? "bg-orange-500 text-white" : "bg-white text-grey-500")}
            >
              All
            </button>
            <button
              onClick={() => setTab("unread")}
              className={cn("px-4 py-2 text-sm font-medium", tab === "unread" ? "bg-orange-500 text-white" : "bg-white text-grey-500")}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-grey-200 py-20 text-center">
              <Bell className="size-10 text-grey-300" />
              <p className="mt-3 text-sm font-medium text-navy-700">Nothing here</p>
              <p className="text-sm text-grey-400">You&apos;re all caught up.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visible.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.5) }}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-4 transition-colors",
                    n.read ? "border-grey-100 bg-white" : "border-orange-200 bg-orange-50/60"
                  )}
                >
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-grey-200" : "bg-orange-500")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy-800">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-sm text-grey-500">{n.body}</p>}
                    <p className="mt-1 text-[11px] text-grey-400">
                      {NOTIFICATION_LABELS[n.type as NotificationType] ?? n.type} · {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {n.orderId && (
                      <Link href={`/orders/${n.orderId}`} className="text-xs font-semibold text-orange-600 hover:text-orange-700">
                        View Order
                      </Link>
                    )}
                    {!n.read && (
                      <button onClick={() => markRead(n.id)} className="text-[11px] text-grey-400 hover:text-navy-600">
                        Mark read
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-grey-400">
                Choose which events notify you in-app. Email and WhatsApp delivery can be connected here once API
                credentials are configured.
              </p>
              <div className="mb-4 flex gap-4 text-xs text-grey-400">
                <span className="flex items-center gap-1">
                  <Smartphone className="size-3.5" /> In-app (active)
                </span>
                <span className="flex items-center gap-1 opacity-50">
                  <Mail className="size-3.5" /> Email (needs setup)
                </span>
                <span className="flex items-center gap-1 opacity-50">
                  <MessageCircle className="size-3.5" /> WhatsApp (needs setup)
                </span>
              </div>
              <div className="space-y-2">
                {NOTIFICATION_TYPES.filter((t) => t !== "GENERAL").map((t) => (
                  <label key={t} className="flex items-center justify-between gap-2 text-sm text-navy-700">
                    {NOTIFICATION_LABELS[t]}
                    <input
                      type="checkbox"
                      checked={prefs[t] ?? true}
                      onChange={() => togglePref(t)}
                      className="size-4 rounded border-grey-300 text-orange-500 focus:ring-orange-300"
                    />
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
