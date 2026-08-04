"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ShieldCheck, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, UrgencyBadge } from "@/components/domain/badges";
import { ApprovalDecisionModal } from "@/components/domain/order-action-modals";
import { OrdersFilterBar, EMPTY_FILTERS, applyOrderFilters, type OrdersFilterState } from "@/components/domain/orders-filter-bar";
import type { OrderRow } from "@/components/domain/orders-table";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ApprovalsPage() {
  const { data: session } = useSession();
  const [scope, setScope] = useState<"mine" | "all-pending">("mine");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OrdersFilterState>(EMPTY_FILTERS);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const query = scope === "mine" ? "awaitingMyApproval=true" : "status=AWAITING_APPROVAL";
    const [o, a, c, b, s] = await Promise.all([
      fetch(`/api/orders?${query}`).then((r) => r.json()),
      fetch("/api/agents").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/branches").then((r) => r.json()),
      fetch("/api/suppliers").then((r) => r.json()),
    ]);
    setOrders(o.orders);
    setAgents(a.agents ?? []);
    setCategories(c.categories);
    setBranches(b.branches);
    setSuppliers(s.suppliers);
    setLoading(false);
  }, [scope]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => applyOrderFilters(orders, filters), [orders, filters]);

  async function handleDecision(decision: "APPROVED" | "DECLINED" | "CHANGES_REQUESTED", comment: string) {
    if (!reviewOrderId) return;
    setActionLoading(true);
    const res = await fetch(`/api/orders/${reviewOrderId}/approvals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, comment }),
    });
    setActionLoading(false);
    if (res.ok) {
      toast.success(decision === "APPROVED" ? "Approval recorded" : decision === "DECLINED" ? "Order declined" : "Changes requested");
      setReviewOrderId(null);
      load();
    } else {
      const d = await res.json();
      toast.error(d.error || "Something went wrong.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-orange-600">Approvals</p>
          <h1 className="font-display text-2xl font-semibold text-navy-800 sm:text-3xl">Orders Awaiting Review</h1>
          <p className="mt-1 text-sm text-grey-500">Approve, decline, or request changes on submitted orders.</p>
        </div>
        <div className="flex overflow-hidden rounded-xl border border-grey-200">
          <button
            onClick={() => setScope("mine")}
            className={`px-4 py-2 text-sm font-medium ${scope === "mine" ? "bg-orange-500 text-white" : "bg-white text-grey-500"}`}
          >
            Assigned to Me
          </button>
          <button
            onClick={() => setScope("all-pending")}
            className={`px-4 py-2 text-sm font-medium ${scope === "all-pending" ? "bg-orange-500 text-white" : "bg-white text-grey-500"}`}
          >
            All Pending
          </button>
        </div>
      </div>

      <OrdersFilterBar
        page="approvals"
        filters={filters}
        onChange={setFilters}
        options={{ agents, branches, categories, suppliers }}
        showAgent
        showApprover={scope === "all-pending"}
      />

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-grey-200 py-20 text-center">
          <ShieldCheck className="size-10 text-emerald-300" />
          <p className="mt-3 text-sm font-medium text-navy-700">Nothing waiting on you</p>
          <p className="text-sm text-grey-400">You&apos;re all caught up.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o, i) => {
            const myApproval = o.approvals.find((a) => a.approverRole === session?.user?.role);
            const canReview = myApproval?.required && myApproval.status === "AWAITING_REVIEW";
            return (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-grey-100 bg-white p-4 shadow-soft"
              >
                <Avatar initials={o.agent.initials} color={o.agent.avatarColor} />
                <div className="min-w-[160px] flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/orders/${o.id}`} className="font-semibold text-navy-800 hover:text-orange-600">
                      {o.orderNumber}
                    </Link>
                    <StatusBadge status={o.status} />
                    <UrgencyBadge urgency={o.urgency} />
                  </div>
                  <p className="text-xs text-grey-500">
                    {o.agent.name} · {o.items[0]?.productNameSnapshot}
                    {o.items.length > 1 ? ` +${o.items.length - 1} more` : ""} · Required by {formatDate(o.requiredDate)}
                  </p>
                </div>
                <p className="text-sm font-medium text-navy-700">{formatCurrency(o.estimatedCost)}</p>
                <div className="flex gap-2">
                  {canReview ? (
                    <Button size="sm" onClick={() => setReviewOrderId(o.id)}>
                      <ShieldCheck className="size-3.5" /> Review
                    </Button>
                  ) : (
                    <Link href={`/orders/${o.id}`}>
                      <Button size="sm" variant="outline">
                        View <ArrowUpRight className="size-3.5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <ApprovalDecisionModal
        open={!!reviewOrderId}
        onClose={() => setReviewOrderId(null)}
        onSubmit={handleDecision}
        loading={actionLoading}
      />
    </div>
  );
}
