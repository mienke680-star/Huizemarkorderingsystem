"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { TIMELINE_STATUSES, ORDER_STATUS_LABELS, ORDER_STATUS_DESCRIPTIONS, type OrderStatus } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type HistoryEntry = {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
  changedBy: { name: string; initials: string; avatarColor: string } | null;
};

export function StatusTimeline({ status, history }: { status: string; history: HistoryEntry[] }) {
  const isTerminalException = status === "DECLINED" || status === "CANCELLED";

  const historyByStatus = new Map<string, HistoryEntry>();
  for (const h of history) {
    if (!historyByStatus.has(h.status)) historyByStatus.set(h.status, h);
  }

  let currentIndex = TIMELINE_STATUSES.indexOf(status as OrderStatus);
  if (isTerminalException) {
    // Find the furthest step actually reached before the exception.
    currentIndex = -1;
    for (const h of history) {
      const idx = TIMELINE_STATUSES.indexOf(h.status as OrderStatus);
      if (idx > currentIndex) currentIndex = idx;
    }
  }

  return (
    <div>
      {isTerminalException && (
        <div className={cn("mb-5 rounded-xl px-4 py-3 text-sm font-medium", status === "DECLINED" ? "bg-red-50 text-red-700" : "bg-grey-100 text-grey-600")}>
          This order was {status === "DECLINED" ? "declined" : "cancelled"}
          {historyByStatus.get(status)?.createdAt && ` on ${formatDateTime(historyByStatus.get(status)!.createdAt)}`}.
          {historyByStatus.get(status)?.note && ` "${historyByStatus.get(status)!.note}"`}
        </div>
      )}
      <div className="relative">
        <div className="absolute top-1 bottom-1 left-[13px] w-px bg-grey-200" />
        <div className="space-y-0">
          {TIMELINE_STATUSES.map((s, i) => {
            const entry = historyByStatus.get(s);
            const completed = i < currentIndex || (i === currentIndex && !isTerminalException) || (isTerminalException && i <= currentIndex);
            const isCurrent = i === currentIndex && !isTerminalException;
            const isFuture = i > currentIndex;

            return (
              <motion.div
                key={s}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-10px" }}
                transition={{ delay: Math.min(i * 0.03, 0.6) }}
                className="relative flex gap-4 pb-5 last:pb-0"
              >
                <div className="relative z-10 flex-shrink-0">
                  {isCurrent ? (
                    <span className="relative flex size-7 items-center justify-center rounded-full bg-orange-500 text-white shadow-orange-glow">
                      <span className="absolute inline-flex size-full animate-pulse-soft rounded-full bg-orange-400" />
                      <span className="relative size-2 rounded-full bg-white" />
                    </span>
                  ) : completed ? (
                    <span className="flex size-7 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="size-3.5" />
                    </span>
                  ) : (
                    <span className="flex size-7 items-center justify-center rounded-full border-2 border-grey-200 bg-white" />
                  )}
                </div>
                <div className={cn("min-w-0 flex-1 pt-0.5", isFuture && "opacity-45")}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cn("text-sm font-semibold", isCurrent ? "text-orange-600" : "text-navy-800")}>
                      {ORDER_STATUS_LABELS[s]}
                    </p>
                    {isCurrent && (
                      <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600">Current</span>
                    )}
                  </div>
                  {!isFuture && <p className="text-xs text-grey-400">{ORDER_STATUS_DESCRIPTIONS[s]}</p>}
                  {entry && (
                    <p className="mt-1 text-[11px] text-grey-400">
                      {formatDateTime(entry.createdAt)}
                      {entry.changedBy && ` · ${entry.changedBy.name}`}
                      {entry.note && ` — "${entry.note}"`}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
