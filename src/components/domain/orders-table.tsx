"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, UrgencyBadge } from "@/components/domain/badges";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { ROLE_LABELS, type Role } from "@/lib/constants";

export type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  urgency: string;
  estimatedCost: number;
  createdAt: string;
  requiredDate: string | null;
  deliveryMethod: string;
  branchId: string | null;
  supplierId: string | null;
  agent: { id: string; name: string; initials: string; avatarColor: string; branch: { name: string } | null };
  branch: { name: string } | null;
  supplier: { name: string } | null;
  items: { productNameSnapshot: string; quantity: number; lineTotalEstimate: number; product: { categoryId: string; category: { name: string } } | null }[];
  approvals: { approverRole: string; status: string; required: boolean }[];
};

export function OrdersTable({ orders, showAgent = true }: { orders: OrderRow[]; showAgent?: boolean }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-grey-200 py-16 text-center">
        <p className="text-sm font-medium text-navy-700">No orders match your filters</p>
        <p className="text-sm text-grey-400">Try adjusting or clearing your filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-grey-100 bg-white shadow-soft">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-grey-100 bg-grey-50/60 text-left text-xs text-grey-400">
            <th className="w-8 py-3 pl-4" />
            <th className="py-3 font-medium">Order</th>
            {showAgent && <th className="py-3 font-medium">Agent</th>}
            <th className="py-3 font-medium">Items</th>
            <th className="py-3 font-medium">Status</th>
            <th className="py-3 font-medium">Urgency</th>
            <th className="py-3 font-medium">Value</th>
            <th className="py-3 font-medium">Created</th>
            <th className="w-10 py-3 pr-4" />
          </tr>
        </thead>
        <tbody>
          {orders.map((o, i) => {
            const isOpen = expanded === o.id;
            const requiredApprovals = o.approvals.filter((a) => a.required);
            return (
              <motion.tr
                key={o.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                className="cursor-pointer border-b border-grey-50 last:border-0 hover:bg-grey-50/70"
                onClick={() => setExpanded(isOpen ? null : o.id)}
              >
                <td className="py-3 pl-4">
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="inline-block text-grey-400">
                    <ChevronDown className="size-4" />
                  </motion.span>
                </td>
                <td className="py-3 font-medium text-navy-800">{o.orderNumber}</td>
                {showAgent && (
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Avatar initials={o.agent.initials} color={o.agent.avatarColor} size="xs" />
                      <span className="text-navy-700">{o.agent.name}</span>
                    </div>
                  </td>
                )}
                <td className="py-3 text-grey-500">
                  {o.items[0]?.productNameSnapshot ?? "—"}
                  {o.items.length > 1 ? ` +${o.items.length - 1} more` : ""}
                </td>
                <td className="py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="py-3">
                  <UrgencyBadge urgency={o.urgency} />
                </td>
                <td className="py-3 text-navy-700">{formatCurrency(o.estimatedCost)}</td>
                <td className="py-3 text-grey-500">{formatDate(o.createdAt)}</td>
                <td className="py-3 pr-4">
                  <Link
                    href={`/orders/${o.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex size-7 items-center justify-center rounded-full text-grey-400 hover:bg-orange-50 hover:text-orange-600"
                  >
                    <ArrowUpRight className="size-4" />
                  </Link>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>

      {orders.map((o) => {
        const requiredApprovals = o.approvals.filter((a) => a.required);
        return (
          expanded === o.id && (
            <AnimatePresence key={`${o.id}-expand`}>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden border-t border-grey-100 bg-grey-50/50 px-6 py-4"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="mb-1 text-xs font-semibold tracking-wide text-grey-400 uppercase">Items</p>
                    {o.items.map((it, idx) => (
                      <p key={idx} className="text-xs text-navy-700">
                        {it.quantity}× {it.productNameSnapshot}
                      </p>
                    ))}
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold tracking-wide text-grey-400 uppercase">Approvals</p>
                    <p className="text-xs text-navy-700">
                      {approvedCountLabel(requiredApprovals)}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {requiredApprovals.map((a) => (
                        <span
                          key={a.approverRole}
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium",
                            a.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-700"
                              : a.status === "DECLINED"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                          )}
                        >
                          {ROLE_LABELS[a.approverRole as Role]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold tracking-wide text-grey-400 uppercase">Fulfilment</p>
                    <p className="text-xs text-navy-700">Branch: {o.branch?.name ?? "—"}</p>
                    <p className="text-xs text-navy-700">Supplier: {o.supplier?.name ?? "Not yet assigned"}</p>
                    <p className="text-xs text-navy-700">Required by: {formatDate(o.requiredDate)}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )
        );
      })}
    </div>
  );
}

function approvedCountLabel(requiredApprovals: { status: string }[]) {
  if (requiredApprovals.length === 0) return "No approvals required";
  const done = requiredApprovals.filter((a) => a.status === "APPROVED").length;
  return `${done} of ${requiredApprovals.length} completed`;
}
