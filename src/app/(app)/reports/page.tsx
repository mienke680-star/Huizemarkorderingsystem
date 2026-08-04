"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarRange,
  Users,
  Tags,
  Truck,
  Timer,
  Factory,
  PackageSearch,
  CheckCircle2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ReportTable, type ReportColumn } from "@/components/domain/report-table";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";

type OrderRecord = {
  id: string;
  orderNumber: string;
  status: string;
  urgency: string;
  estimatedCost: number;
  actualCost: number | null;
  createdAt: string;
  submittedAt: string | null;
  completedAt: string | null;
  trackingNumber: string | null;
  courierName: string | null;
  agent: { name: string };
  supplier: { name: string } | null;
  items: { productNameSnapshot: string; quantity: number; lineTotalEstimate: number; product: { category: { name: string } } | null }[];
};

type TurnaroundRow = {
  orderNumber: string;
  agent: string;
  status: string;
  submittedAt: string | null;
  approvedAt: string | null;
  approvalHours: number | null;
  manufacturingStart: string | null;
  manufacturingEnd: string | null;
  manufacturingDays: number | null;
};

type AgentStat = {
  name: string;
  branch: string;
  ordersCount: number;
  totalValue: number;
  avgOrderValue: number;
  completedCount: number;
  declinedCount: number;
};

const REPORTS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "monthly", label: "Monthly Order Report", icon: CalendarRange },
  { key: "byAgent", label: "Orders by Agent", icon: Users },
  { key: "byCategory", label: "Orders by Category", icon: Tags },
  { key: "bySupplier", label: "Orders by Supplier", icon: Truck },
  { key: "approval", label: "Approval Turnaround", icon: Timer },
  { key: "manufacturing", label: "Manufacturing Turnaround", icon: Factory },
  { key: "courier", label: "Courier Report", icon: Truck },
  { key: "outstanding", label: "Outstanding Orders", icon: PackageSearch },
  { key: "completed", label: "Completed Orders", icon: CheckCircle2 },
  { key: "cost", label: "Budget vs Actual", icon: Wallet },
];

export default function ReportsPage() {
  const [active, setActive] = useState("monthly");
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [agents, setAgents] = useState<AgentStat[]>([]);
  const [turnaround, setTurnaround] = useState<TurnaroundRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/orders").then((r) => r.json()),
      fetch("/api/analytics/agents").then((r) => r.json()),
      fetch("/api/reports/turnaround").then((r) => r.json()),
    ]).then(([o, a, t]) => {
      setOrders(o.orders);
      setAgents(a.agents);
      setTurnaround(t.rows);
      setLoading(false);
    });
  }, []);

  const monthlyRows = useMemo(() => {
    const map = new Map<string, { orders: number; value: number }>();
    for (const o of orders) {
      const d = new Date(o.createdAt);
      const key = d.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
      const entry = map.get(key) ?? { orders: 0, value: 0 };
      entry.orders += 1;
      entry.value += o.estimatedCost;
      map.set(key, entry);
    }
    return Array.from(map.entries()).map(([month, v]) => ({ month, ...v }));
  }, [orders]);

  const categoryRows = useMemo(() => {
    const map = new Map<string, { orders: Set<string>; quantity: number; value: number }>();
    for (const o of orders) {
      for (const it of o.items) {
        const cat = it.product?.category?.name ?? "Uncategorised";
        const entry = map.get(cat) ?? { orders: new Set<string>(), quantity: 0, value: 0 };
        entry.orders.add(o.id);
        entry.quantity += it.quantity;
        entry.value += it.lineTotalEstimate;
        map.set(cat, entry);
      }
    }
    return Array.from(map.entries())
      .map(([category, v]) => ({ category, orders: v.orders.size, quantity: v.quantity, value: v.value }))
      .sort((a, b) => b.value - a.value);
  }, [orders]);

  const supplierRows = useMemo(() => {
    const map = new Map<string, { orders: number; value: number }>();
    for (const o of orders) {
      if (!o.supplier) continue;
      const entry = map.get(o.supplier.name) ?? { orders: 0, value: 0 };
      entry.orders += 1;
      entry.value += o.estimatedCost;
      map.set(o.supplier.name, entry);
    }
    return Array.from(map.entries()).map(([supplier, v]) => ({ supplier, ...v })).sort((a, b) => b.value - a.value);
  }, [orders]);

  const courierRows = useMemo(() => orders.filter((o) => o.courierName || o.trackingNumber), [orders]);
  const outstandingRows = useMemo(
    () => orders.filter((o) => !["COMPLETED", "DECLINED", "CANCELLED", "DRAFT"].includes(o.status)),
    [orders]
  );
  const completedRows = useMemo(() => orders.filter((o) => o.status === "COMPLETED"), [orders]);
  const costRows = useMemo(() => orders.filter((o) => o.actualCost !== null), [orders]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-64 rounded-xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-orange-600">Reports</p>
        <h1 className="font-display text-2xl font-semibold text-navy-800 sm:text-3xl">Operational Reports</h1>
        <p className="mt-1 text-sm text-grey-500">Export or print any report for offline review.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        <div className="space-y-1 print:hidden lg:col-span-1">
          {REPORTS.map((r) => (
            <button
              key={r.key}
              onClick={() => setActive(r.key)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors",
                active === r.key ? "bg-orange-50 text-orange-700" : "text-navy-600 hover:bg-grey-50"
              )}
            >
              <r.icon className="size-4" /> {r.label}
            </button>
          ))}
        </div>

        <Card className="lg:col-span-3">
          <CardContent className="pt-6">
            <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              {active === "monthly" && (
                <ReportTable
                  title="Monthly Order Report"
                  description="Orders submitted and their estimated value, by month."
                  filename="monthly-order-report"
                  columns={
                    [
                      { key: "month", label: "Month", render: (r) => r.month },
                      { key: "orders", label: "Orders", render: (r) => String(r.orders), align: "right" },
                      { key: "value", label: "Estimated Value", render: (r) => formatCurrency(r.value), align: "right" },
                    ] as ReportColumn<(typeof monthlyRows)[number]>[]
                  }
                  rows={monthlyRows}
                />
              )}
              {active === "byAgent" && (
                <ReportTable
                  title="Orders by Agent"
                  description="Volume and value of orders submitted per agent."
                  filename="orders-by-agent"
                  columns={
                    [
                      { key: "name", label: "Agent", render: (r) => r.name },
                      { key: "branch", label: "Branch", render: (r) => r.branch },
                      { key: "ordersCount", label: "Orders", render: (r) => String(r.ordersCount), align: "right" },
                      { key: "totalValue", label: "Total Value", render: (r) => formatCurrency(r.totalValue), align: "right" },
                      { key: "avgOrderValue", label: "Avg Value", render: (r) => formatCurrency(r.avgOrderValue), align: "right" },
                      { key: "completedCount", label: "Completed", render: (r) => String(r.completedCount), align: "right" },
                      { key: "declinedCount", label: "Declined", render: (r) => String(r.declinedCount), align: "right" },
                    ] as ReportColumn<AgentStat>[]
                  }
                  rows={agents}
                />
              )}
              {active === "byCategory" && (
                <ReportTable
                  title="Orders by Category"
                  description="Item quantity and value ordered per product category."
                  filename="orders-by-category"
                  columns={
                    [
                      { key: "category", label: "Category", render: (r) => r.category },
                      { key: "orders", label: "Orders", render: (r) => String(r.orders), align: "right" },
                      { key: "quantity", label: "Quantity", render: (r) => String(r.quantity), align: "right" },
                      { key: "value", label: "Value", render: (r) => formatCurrency(r.value), align: "right" },
                    ] as ReportColumn<(typeof categoryRows)[number]>[]
                  }
                  rows={categoryRows}
                />
              )}
              {active === "bySupplier" && (
                <ReportTable
                  title="Orders by Supplier"
                  description="Order volume and value assigned to each supplier."
                  filename="orders-by-supplier"
                  columns={
                    [
                      { key: "supplier", label: "Supplier", render: (r) => r.supplier },
                      { key: "orders", label: "Orders", render: (r) => String(r.orders), align: "right" },
                      { key: "value", label: "Value", render: (r) => formatCurrency(r.value), align: "right" },
                    ] as ReportColumn<(typeof supplierRows)[number]>[]
                  }
                  rows={supplierRows}
                />
              )}
              {active === "approval" && (
                <ReportTable
                  title="Approval Turnaround Time"
                  description="Time from submission to full approval."
                  filename="approval-turnaround"
                  summary={[
                    {
                      label: "Average Turnaround",
                      value: avgLabel(turnaround.map((t) => t.approvalHours), "h"),
                    },
                  ]}
                  columns={
                    [
                      { key: "orderNumber", label: "Order", render: (r) => r.orderNumber },
                      { key: "agent", label: "Agent", render: (r) => r.agent },
                      { key: "submittedAt", label: "Submitted", render: (r) => formatDate(r.submittedAt) },
                      { key: "approvedAt", label: "Approved", render: (r) => formatDate(r.approvedAt) },
                      {
                        key: "approvalHours",
                        label: "Hours",
                        render: (r) => (r.approvalHours !== null ? r.approvalHours.toFixed(1) : "—"),
                        align: "right",
                      },
                    ] as ReportColumn<TurnaroundRow>[]
                  }
                  rows={turnaround.filter((t) => t.approvalHours !== null)}
                />
              )}
              {active === "manufacturing" && (
                <ReportTable
                  title="Manufacturing Turnaround Time"
                  description="Time from start of manufacturing to quality check / collection-ready."
                  filename="manufacturing-turnaround"
                  summary={[
                    {
                      label: "Average Turnaround",
                      value: avgLabel(turnaround.map((t) => t.manufacturingDays), "d"),
                    },
                  ]}
                  columns={
                    [
                      { key: "orderNumber", label: "Order", render: (r) => r.orderNumber },
                      { key: "agent", label: "Agent", render: (r) => r.agent },
                      { key: "manufacturingStart", label: "Started", render: (r) => formatDate(r.manufacturingStart) },
                      { key: "manufacturingEnd", label: "Ready", render: (r) => formatDate(r.manufacturingEnd) },
                      {
                        key: "manufacturingDays",
                        label: "Days",
                        render: (r) => (r.manufacturingDays !== null ? r.manufacturingDays.toFixed(1) : "—"),
                        align: "right",
                      },
                    ] as ReportColumn<TurnaroundRow>[]
                  }
                  rows={turnaround.filter((t) => t.manufacturingDays !== null)}
                />
              )}
              {active === "courier" && (
                <ReportTable
                  title="Courier Report"
                  description="Orders that have been booked with a courier."
                  filename="courier-report"
                  columns={
                    [
                      { key: "orderNumber", label: "Order", render: (r) => r.orderNumber },
                      { key: "agent", label: "Agent", render: (r) => r.agent.name },
                      { key: "courierName", label: "Courier", render: (r) => r.courierName ?? "—" },
                      { key: "trackingNumber", label: "Tracking #", render: (r) => r.trackingNumber ?? "—" },
                      { key: "status", label: "Status", render: (r) => ORDER_STATUS_LABELS[r.status as OrderStatus] ?? r.status },
                    ] as ReportColumn<OrderRecord>[]
                  }
                  rows={courierRows}
                />
              )}
              {active === "outstanding" && (
                <ReportTable
                  title="Outstanding Order Report"
                  description="Orders still in progress — not yet completed, declined or cancelled."
                  filename="outstanding-orders"
                  columns={
                    [
                      { key: "orderNumber", label: "Order", render: (r) => r.orderNumber },
                      { key: "agent", label: "Agent", render: (r) => r.agent.name },
                      { key: "status", label: "Status", render: (r) => ORDER_STATUS_LABELS[r.status as OrderStatus] ?? r.status },
                      { key: "createdAt", label: "Created", render: (r) => formatDate(r.createdAt) },
                      { key: "estimatedCost", label: "Value", render: (r) => formatCurrency(r.estimatedCost), align: "right" },
                    ] as ReportColumn<OrderRecord>[]
                  }
                  rows={outstandingRows}
                />
              )}
              {active === "completed" && (
                <ReportTable
                  title="Completed Order Report"
                  description="Orders that have reached completion."
                  filename="completed-orders"
                  columns={
                    [
                      { key: "orderNumber", label: "Order", render: (r) => r.orderNumber },
                      { key: "agent", label: "Agent", render: (r) => r.agent.name },
                      { key: "completedAt", label: "Completed", render: (r) => formatDate(r.completedAt) },
                      { key: "estimatedCost", label: "Value", render: (r) => formatCurrency(r.estimatedCost), align: "right" },
                    ] as ReportColumn<OrderRecord>[]
                  }
                  rows={completedRows}
                />
              )}
              {active === "cost" && (
                <ReportTable
                  title="Budget vs Actual Cost Report"
                  description="Estimated vs actual cost for orders with recorded actuals."
                  filename="budget-vs-actual"
                  columns={
                    [
                      { key: "orderNumber", label: "Order", render: (r) => r.orderNumber },
                      { key: "agent", label: "Agent", render: (r) => r.agent.name },
                      { key: "estimatedCost", label: "Estimated", render: (r) => formatCurrency(r.estimatedCost), align: "right" },
                      { key: "actualCost", label: "Actual", render: (r) => formatCurrency(r.actualCost), align: "right" },
                      {
                        key: "variance",
                        label: "Variance",
                        render: (r) => formatCurrency((r.actualCost ?? 0) - r.estimatedCost),
                        align: "right",
                      },
                    ] as ReportColumn<OrderRecord>[]
                  }
                  rows={costRows}
                />
              )}
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function avgLabel(values: (number | null)[], suffix: string) {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length === 0) return "—";
  return `${(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1)}${suffix}`;
}
