"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Download, ArrowUpDown, Users, Activity, Clock3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/domain/stat-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HorizontalBarChart } from "@/components/charts/bar-chart";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

type AgentStat = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  branch: string;
  ordersCount: number;
  totalValue: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  ordersThisYear: number;
  outstandingCount: number;
  completedCount: number;
  declinedCount: number;
  avgOrderValue: number;
  avgProcessingDays: number | null;
  lastOrderDate: string | null;
};

type SortKey = "ordersCount" | "totalValue" | "avgOrderValue" | "outstandingCount" | "lastOrderDate";

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentStat[]>([]);
  const [mostOrdered, setMostOrdered] = useState<{ name: string; quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("ordersCount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetch("/api/analytics/agents")
      .then((r) => r.json())
      .then((d) => {
        setAgents(d.agents);
        setMostOrdered(d.mostOrderedProducts);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    let list = agents.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
    list = [...list].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      const aNum = sortKey === "lastOrderDate" ? new Date(av || 0).getTime() : Number(av);
      const bNum = sortKey === "lastOrderDate" ? new Date(bv || 0).getTime() : Number(bv);
      return sortDir === "desc" ? bNum - aNum : aNum - bNum;
    });
    return list;
  }, [agents, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const totalAgents = agents.length;
  const activeThisMonth = agents.filter((a) => a.ordersThisMonth > 0).length;
  const noRecentOrders = agents.filter((a) => !a.lastOrderDate || daysSince(a.lastOrderDate) > 30).length;

  function exportCsv() {
    const headers = ["Agent", "Branch", "Orders", "Total Value", "Avg Order Value", "Outstanding", "Completed", "Declined", "Last Order"];
    const rows = filtered.map((a) => [
      a.name,
      a.branch,
      a.ordersCount,
      a.totalValue.toFixed(2),
      a.avgOrderValue.toFixed(2),
      a.outstandingCount,
      a.completedCount,
      a.declinedCount,
      a.lastOrderDate ? formatDate(a.lastOrderDate) : "—",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agent-activity.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const chartData = [...agents]
    .sort((a, b) => b.ordersCount - a.ordersCount)
    .slice(0, 8)
    .map((a) => ({ name: a.name, value: a.ordersCount, color: "#ff6b00" }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-orange-600">Agent Activity</p>
          <h1 className="font-display text-2xl font-semibold text-navy-800 sm:text-3xl">Operational Overview</h1>
          <p className="mt-1 text-sm text-grey-500">A shared view of ordering activity across the agent network — for planning, not ranking.</p>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="size-4" /> Export CSV
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total Agents" value={totalAgents} icon={Users} tone="navy" />
          <StatCard label="Active This Month" value={activeThisMonth} icon={Activity} tone="green" delay={0.05} />
          <StatCard label="No Orders in 30+ Days" value={noRecentOrders} icon={Clock3} tone="amber" delay={0.1} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Orders by Agent</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="skeleton h-64 rounded-xl" /> : <HorizontalBarChart data={chartData} height={280} />}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Most Ordered Products</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="skeleton h-64 rounded-xl" />
            ) : (
              <HorizontalBarChart
                data={mostOrdered.map((p) => ({ name: p.name, value: p.quantity, color: "#142244" }))}
                height={280}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Overview</CardTitle>
          <div className="relative max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-grey-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search agents…" className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton h-12 rounded-xl" />
              ))}
            </div>
          ) : (
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-grey-100 text-left text-xs text-grey-400">
                  <th className="pb-2 font-medium">Agent</th>
                  <SortableHeader label="Orders" sortKey="ordersCount" current={sortKey} dir={sortDir} onClick={toggleSort} />
                  <SortableHeader label="Total Value" sortKey="totalValue" current={sortKey} dir={sortDir} onClick={toggleSort} />
                  <SortableHeader label="Avg Value" sortKey="avgOrderValue" current={sortKey} dir={sortDir} onClick={toggleSort} />
                  <SortableHeader label="Outstanding" sortKey="outstandingCount" current={sortKey} dir={sortDir} onClick={toggleSort} />
                  <th className="pb-2 font-medium">Completed</th>
                  <th className="pb-2 font-medium">Declined</th>
                  <SortableHeader label="Last Order" sortKey="lastOrderDate" current={sortKey} dir={sortDir} onClick={toggleSort} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className="border-b border-grey-50 last:border-0 hover:bg-grey-50/70"
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={a.initials} color={a.avatarColor} size="sm" />
                        <div>
                          <p className="font-medium text-navy-800">{a.name}</p>
                          <p className="text-[11px] text-grey-400">{a.branch}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-navy-700">{a.ordersCount}</td>
                    <td className="py-3 text-navy-700">{formatCurrency(a.totalValue)}</td>
                    <td className="py-3 text-navy-700">{formatCurrency(a.avgOrderValue)}</td>
                    <td className="py-3 text-navy-700">{a.outstandingCount}</td>
                    <td className="py-3 text-emerald-600">{a.completedCount}</td>
                    <td className="py-3 text-red-500">{a.declinedCount}</td>
                    <td className="py-3 text-grey-500">{a.lastOrderDate ? formatDate(a.lastOrderDate) : "No orders yet"}</td>
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

function daysSince(date: string) {
  return Math.floor((Date.now() - new Date(date).getTime()) / 864e5);
}

function SortableHeader({
  label,
  sortKey,
  current,
  dir,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: "asc" | "desc";
  onClick: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th className="pb-2 font-medium">
      <button onClick={() => onClick(sortKey)} className={cn("flex items-center gap-1", active && "text-orange-600")}>
        {label} <ArrowUpDown className="size-3" />
        {active && <span className="sr-only">{dir}</span>}
      </button>
    </th>
  );
}
