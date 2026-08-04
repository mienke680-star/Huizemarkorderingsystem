"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Truck, PackageSearch, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, UrgencyBadge } from "@/components/domain/badges";
import { StatusTimeline, type HistoryEntry } from "@/components/domain/status-timeline";
import { formatDate, cn } from "@/lib/utils";
import { ACTIVE_STATUSES, type OrderStatus } from "@/lib/constants";

type OrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  urgency: string;
  estimatedCost: number;
  createdAt: string;
  trackingNumber: string | null;
  courierName: string | null;
  agent: { name: string; initials: string; avatarColor: string };
  items: { productNameSnapshot: string }[];
};

type OrderDetail = OrderSummary & {
  estimatedCompletionDate: string | null;
  deliveryMethod: string;
  supplier: { name: string } | null;
  statusHistory: HistoryEntry[];
};

export default function TrackingPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => {
        const list: OrderSummary[] = d.orders.filter((o: OrderSummary) => o.status !== "DRAFT");
        setOrders(list);
        setLoading(false);
        const firstActive = list.find((o) => ACTIVE_STATUSES.includes(o.status as OrderStatus)) ?? list[0];
        if (firstActive) setSelectedId(firstActive.id);
      });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setDetailLoading(true);
    fetch(`/api/orders/${selectedId}`)
      .then((r) => r.json())
      .then((d) => {
        setDetail(d.order);
        setDetailLoading(false);
      });
  }, [selectedId]);

  const filtered = useMemo(() => {
    const list = [...orders].sort((a, b) => {
      const aActive = ACTIVE_STATUSES.includes(a.status as OrderStatus) ? 0 : 1;
      const bActive = ACTIVE_STATUSES.includes(b.status as OrderStatus) ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(
      (o) => o.orderNumber.toLowerCase().includes(q) || o.trackingNumber?.toLowerCase().includes(q) || o.agent.name.toLowerCase().includes(q)
    );
  }, [orders, search]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-orange-600">Order Tracking</p>
        <h1 className="font-display text-2xl font-semibold text-navy-800 sm:text-3xl">Track an Order</h1>
        <p className="mt-1 text-sm text-grey-500">Follow any order&apos;s journey from submission to delivery.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-grey-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order # or tracking #…" className="pl-10" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-1">
          {loading ? (
            [...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-grey-200 py-12 text-center text-sm text-grey-400">
              No orders to track yet.
            </div>
          ) : (
            filtered.map((o) => (
              <motion.button
                key={o.id}
                onClick={() => setSelectedId(o.id)}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                  selectedId === o.id ? "border-orange-400 bg-orange-50" : "border-grey-100 bg-white hover:border-grey-200"
                )}
              >
                <Avatar initials={o.agent.initials} color={o.agent.avatarColor} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy-800">{o.orderNumber}</p>
                  <p className="truncate text-xs text-grey-400">{o.items[0]?.productNameSnapshot}</p>
                </div>
                <StatusBadge status={o.status} className="shrink-0" />
              </motion.button>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {detailLoading || !detail ? (
            <div className="skeleton h-96 rounded-2xl" />
          ) : (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>{detail.orderNumber}</CardTitle>
                  <p className="mt-1 text-xs text-grey-400">
                    {detail.agent.name} · {detail.items.map((i) => i.productNameSnapshot).join(", ")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={detail.status} />
                  <UrgencyBadge urgency={detail.urgency} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <InfoTile icon={Truck} label="Courier" value={detail.courierName ?? "Not booked"} />
                  <InfoTile icon={PackageSearch} label="Tracking #" value={detail.trackingNumber ?? "—"} />
                  <InfoTile icon={MapPin} label="Supplier" value={detail.supplier?.name ?? "Not assigned"} />
                  <InfoTile icon={PackageSearch} label="Est. Completion" value={formatDate(detail.estimatedCompletionDate)} />
                </div>
                <StatusTimeline status={detail.status} history={detail.statusHistory} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: typeof Truck; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-grey-100 bg-grey-50/60 p-3">
      <p className="flex items-center gap-1.5 text-[11px] text-grey-400">
        <Icon className="size-3" /> {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium text-navy-800">{value}</p>
    </div>
  );
}
