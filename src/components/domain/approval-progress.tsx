"use client";

import { motion } from "framer-motion";
import { Check, X, MessageSquareWarning, Clock, Minus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type ApprovalRow = {
  id: string;
  approverRole: string;
  status: string;
  comment: string | null;
  respondedAt: string | null;
  required: boolean;
  respondedBy: { name: string; initials: string; avatarColor: string } | null;
};

const STATUS_META: Record<string, { icon: typeof Check; tone: string; label: string }> = {
  APPROVED: { icon: Check, tone: "bg-emerald-500 text-white", label: "Approved" },
  DECLINED: { icon: X, tone: "bg-red-500 text-white", label: "Declined" },
  CHANGES_REQUESTED: { icon: MessageSquareWarning, tone: "bg-orange-500 text-white", label: "Changes Requested" },
  AWAITING_REVIEW: { icon: Clock, tone: "bg-amber-100 text-amber-700", label: "Awaiting Review" },
  NOT_REQUIRED: { icon: Minus, tone: "bg-grey-100 text-grey-400", label: "Not Required" },
};

// Fixed presentation order for the four named approvers.
const ROLE_ORDER: Role[] = ["MIENKE", "MJ", "NADIA", "CHANTAL"];

export function ApprovalProgress({ approvals }: { approvals: ApprovalRow[] }) {
  const required = approvals.filter((a) => a.required);
  const completed = required.filter((a) => a.status === "APPROVED").length;
  const total = required.length;
  const pct = total > 0 ? (completed / total) * 100 : 0;
  const sorted = [...approvals].sort((a, b) => ROLE_ORDER.indexOf(a.approverRole as Role) - ROLE_ORDER.indexOf(b.approverRole as Role));

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm font-medium text-navy-700">
          {total > 0 ? (
            <>
              <span className="font-display text-lg font-semibold text-navy-800">{completed}</span> of{" "}
              <span className="font-semibold">{total}</span> approvals completed
            </>
          ) : (
            "No approvals required"
          )}
        </p>
      </div>
      {total > 0 && (
        <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-grey-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sorted.map((a, i) => {
          const meta = STATUS_META[a.status] ?? STATUS_META.AWAITING_REVIEW;
          const Icon = meta.icon;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                "rounded-xl border p-4",
                a.required ? "border-grey-100 bg-white" : "border-grey-100 bg-grey-50/60 opacity-70"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Avatar initials={ROLE_LABELS[a.approverRole as Role][0]} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-navy-800">{ROLE_LABELS[a.approverRole as Role]}</p>
                    <p className="text-[11px] text-grey-400">{a.required ? "Required approver" : "Not required"}</p>
                  </div>
                </div>
                <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", meta.tone)}>
                  <Icon className="size-3.5" />
                </span>
              </div>
              {a.respondedAt && (
                <p className="mt-2.5 text-[11px] text-grey-400">
                  {meta.label} · {formatDateTime(a.respondedAt)}
                </p>
              )}
              {a.comment && (
                <p className="mt-1.5 rounded-lg bg-grey-50 p-2 text-xs text-navy-600 italic">&ldquo;{a.comment}&rdquo;</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
