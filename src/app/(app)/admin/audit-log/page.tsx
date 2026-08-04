"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search, ScrollText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Input, Select } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";

type LogEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  orderNumber: string | null;
  previousValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: { name: string; initials: string; avatarColor: string } | null;
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (action) params.set("action", action);
    const t = setTimeout(() => {
      fetch(`/api/audit-log?${params.toString()}`)
        .then((r) => r.json())
        .then((d) => {
          setLogs(d.logs);
          setActions(d.actions);
          setLoading(false);
        });
    }, 200);
    return () => clearTimeout(t);
  }, [q, action]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-orange-600">Administration</p>
        <h1 className="font-display text-2xl font-semibold text-navy-800 sm:text-3xl">Audit Trail</h1>
        <p className="mt-1 text-sm text-grey-500">A complete, chronological log of every significant action across the platform.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-grey-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order #, action…" className="pl-9" />
        </div>
        <Select value={action} onChange={(e) => setAction(e.target.value)} className="w-auto min-w-[180px]">
          <option value="">All Actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton h-12 rounded-xl" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ScrollText className="size-8 text-grey-300" />
              <p className="mt-2 text-sm text-grey-400">No matching activity.</p>
            </div>
          ) : (
            <div className="divide-y divide-grey-50">
              {logs.map((l, i) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.015, 0.4) }}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
                >
                  {l.user ? (
                    <Avatar initials={l.user.initials} color={l.user.avatarColor} size="xs" />
                  ) : (
                    <span className="size-6 rounded-full bg-grey-100" />
                  )}
                  <span className="min-w-[140px] font-medium text-navy-800">{l.user?.name ?? "System"}</span>
                  <span className="rounded-full bg-grey-100 px-2 py-0.5 text-[11px] font-semibold text-grey-600">
                    {l.action.replaceAll("_", " ")}
                  </span>
                  {l.orderNumber && (
                    <Link href={`/orders`} className="text-xs font-medium text-orange-600 hover:text-orange-700">
                      {l.orderNumber}
                    </Link>
                  )}
                  {l.newValue && <span className="truncate text-xs text-grey-500">→ {l.newValue}</span>}
                  <span className="ml-auto shrink-0 text-xs text-grey-400">{formatDateTime(l.createdAt)}</span>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
