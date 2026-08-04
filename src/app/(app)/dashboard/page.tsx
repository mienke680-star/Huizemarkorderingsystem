"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ClipboardList,
  FileEdit,
  Clock,
  CheckCircle2,
  Factory,
  PackageCheck,
  Truck,
  Trophy,
  XCircle,
  Flame,
  CalendarDays,
  Wallet,
  Timer,
  Gauge,
  ArrowUpRight,
  PlusCircle,
} from "lucide-react";
import { StatCard } from "@/components/domain/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DonutChart } from "@/components/charts/donut-chart";
import { TrendChart } from "@/components/charts/trend-chart";
import { StatusBadge, UrgencyBadge } from "@/components/domain/badges";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ROLE_DASHBOARD_LABEL, isManager, isAdmin } from "@/lib/constants";

type DashboardData = {
  scope: "ALL" | "MINE";
  totals: {
    totalOrders: number;
    draftOrders: number;
    awaitingApproval: number;
    changesRequested: number;
    approvedOrders: number;
    inManufacturing: number;
    readyForCollection: number;
    beingCouriered: number;
    completedOrders: number;
    declinedOrders: number;
    cancelledOrders: number;
    urgentOrders: number;
    ordersThisMonth: number;
    estimatedMonthlyValue: number;
    avgApprovalTimeHours: number;
    avgManufacturingTimeDays: number;
    awaitingMyApproval: number;
  };
  statusCounts: Record<string, number>;
  monthlyTrend: { month: string; orders: number; value: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    urgency: string;
    estimatedCost: number;
    createdAt: string;
    agent: { name: string; initials: string; avatarColor: string };
    itemSummary: string;
    itemCount: number;
  }[];
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  const role = session?.user?.role;
  const managerOrAdmin = role && (isManager(role) || isAdmin(role));

  const donutData = data
    ? [
        { name: "Draft", value: data.totals.draftOrders, color: "#9aa3b5" },
        { name: "Awaiting Approval", value: data.totals.awaitingApproval, color: "#f59e0b" },
        { name: "In Progress", value: data.totals.approvedOrders - data.totals.completedOrders, color: "#ff6b00" },
        { name: "Completed", value: data.totals.completedOrders, color: "#10b981" },
        { name: "Declined / Cancelled", value: data.totals.declinedOrders + data.totals.cancelledOrders, color: "#ef4444" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium text-orange-600"
          >
            {role ? ROLE_DASHBOARD_LABEL[role] : "Dashboard"}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-2xl font-semibold text-navy-800 sm:text-3xl"
          >
            {greeting()}, {session?.user?.name?.split(" ")[0] ?? ""}
          </motion.h1>
          <p className="mt-1 text-sm text-grey-500">Here&apos;s what&apos;s happening across the ordering hub today.</p>
        </div>
        {(role === "AGENT" || role === "ADMIN") && (
          <Link href="/orders/new">
            <Button magnetic>
              <PlusCircle className="size-4" /> New Order
            </Button>
          </Link>
        )}
      </div>

      {managerOrAdmin && data && data.totals.awaitingMyApproval > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Clock className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-orange-800">
                {data.totals.awaitingMyApproval} order{data.totals.awaitingMyApproval > 1 ? "s" : ""} awaiting your approval
              </p>
              <p className="text-xs text-orange-700/80">Review them to keep orders moving through the pipeline.</p>
            </div>
          </div>
          <Link href="/approvals">
            <Button variant="secondary" size="sm">
              Review now <ArrowUpRight className="size-3.5" />
            </Button>
          </Link>
        </motion.div>
      )}

      {!data ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Total Orders" value={data.totals.totalOrders} icon={ClipboardList} tone="navy" delay={0} />
          <StatCard label="Draft Orders" value={data.totals.draftOrders} icon={FileEdit} tone="amber" delay={0.03} />
          <StatCard
            label="Awaiting Approval"
            value={data.totals.awaitingApproval}
            icon={Clock}
            tone="amber"
            delay={0.06}
          />
          <StatCard label="Approved" value={data.totals.approvedOrders} icon={CheckCircle2} tone="green" delay={0.09} />
          <StatCard label="In Manufacturing" value={data.totals.inManufacturing} icon={Factory} tone="orange" delay={0.12} />
          <StatCard
            label="Ready for Collection"
            value={data.totals.readyForCollection}
            icon={PackageCheck}
            tone="green"
            delay={0.15}
          />
          <StatCard label="Being Couriered" value={data.totals.beingCouriered} icon={Truck} tone="blue" delay={0.18} />
          <StatCard label="Completed" value={data.totals.completedOrders} icon={Trophy} tone="green" delay={0.21} />
          <StatCard label="Declined" value={data.totals.declinedOrders} icon={XCircle} tone="red" delay={0.24} />
          <StatCard label="Urgent Orders" value={data.totals.urgentOrders} icon={Flame} tone="red" delay={0.27} />
          <StatCard label="Orders This Month" value={data.totals.ordersThisMonth} icon={CalendarDays} tone="navy" delay={0.3} />
          <StatCard
            label="Est. Monthly Value"
            value={data.totals.estimatedMonthlyValue}
            icon={Wallet}
            tone="orange"
            prefix="R "
            delay={0.33}
          />
          {managerOrAdmin && (
            <>
              <StatCard
                label="Avg Approval Time"
                value={Number(data.totals.avgApprovalTimeHours.toFixed(1))}
                icon={Timer}
                tone="blue"
                suffix="h"
                decimals={1}
                delay={0.36}
              />
              <StatCard
                label="Avg Manufacturing Time"
                value={Number(data.totals.avgManufacturingTimeDays.toFixed(1))}
                icon={Gauge}
                tone="blue"
                suffix="d"
                decimals={1}
                delay={0.39}
              />
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Orders Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? <TrendChart data={data.monthlyTrend} dataKey="orders" /> : <div className="skeleton h-60 rounded-xl" />}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Order Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? <DonutChart data={donutData} /> : <div className="skeleton h-60 rounded-xl" />}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <Link href={role === "AGENT" ? "/orders/mine" : "/orders"} className="text-xs font-semibold text-orange-600 hover:text-orange-700">
            View all →
          </Link>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {!data ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-12 rounded-xl" />
              ))}
            </div>
          ) : data.recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-grey-400">No orders yet.</p>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-grey-100 text-left text-xs text-grey-400">
                  <th className="pb-2 font-medium">Order</th>
                  {data.scope === "ALL" && <th className="pb-2 font-medium">Agent</th>}
                  <th className="pb-2 font-medium">Item</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Urgency</th>
                  <th className="pb-2 font-medium">Value</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((o, i) => (
                  <motion.tr
                    key={o.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-grey-50 last:border-0 hover:bg-grey-50"
                  >
                    <td className="py-3">
                      <Link href={`/orders/${o.id}`} className="font-medium text-navy-800 hover:text-orange-600">
                        {o.orderNumber}
                      </Link>
                    </td>
                    {data.scope === "ALL" && (
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Avatar initials={o.agent.initials} color={o.agent.avatarColor} size="xs" />
                          <span className="text-navy-700">{o.agent.name}</span>
                        </div>
                      </td>
                    )}
                    <td className="py-3 text-grey-500">
                      {o.itemSummary}
                      {o.itemCount > 1 ? ` +${o.itemCount - 1} more` : ""}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-3">
                      <UrgencyBadge urgency={o.urgency} />
                    </td>
                    <td className="py-3 text-navy-700">{formatCurrency(o.estimatedCost)}</td>
                    <td className="py-3 text-grey-500">{formatDate(o.createdAt)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
