"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, BookmarkPlus, Search, X } from "lucide-react";
import { Select, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  URGENCY_LEVELS,
  URGENCY_LABELS,
  DELIVERY_METHODS,
  DELIVERY_METHOD_LABELS,
  MANAGER_ROLES,
  ROLE_LABELS,
  type Role,
} from "@/lib/constants";

export type OrdersFilterState = {
  q: string;
  status: string;
  urgency: string;
  agentId: string;
  branchId: string;
  categoryId: string;
  supplierId: string;
  deliveryMethod: string;
  approverRole: string;
  dateFrom: string;
  dateTo: string;
};

export const EMPTY_FILTERS: OrdersFilterState = {
  q: "",
  status: "",
  urgency: "",
  agentId: "",
  branchId: "",
  categoryId: "",
  supplierId: "",
  deliveryMethod: "",
  approverRole: "",
  dateFrom: "",
  dateTo: "",
};

export function OrdersFilterBar({
  page,
  filters,
  onChange,
  options,
  showAgent = true,
  showApprover = false,
}: {
  page: string;
  filters: OrdersFilterState;
  onChange: (f: OrdersFilterState) => void;
  options: {
    agents: { id: string; name: string }[];
    branches: { id: string; name: string }[];
    categories: { id: string; name: string }[];
    suppliers: { id: string; name: string }[];
  };
  showAgent?: boolean;
  showApprover?: boolean;
}) {
  const [savedFilters, setSavedFilters] = useState<{ id: string; name: string; filterJson: string }[]>([]);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveName, setSaveName] = useState("");

  useEffect(() => {
    fetch(`/api/saved-filters?page=${page}`)
      .then((r) => r.json())
      .then((d) => setSavedFilters(d.filters ?? []));
  }, [page]);

  function set<K extends keyof OrdersFilterState>(key: K, value: string) {
    onChange({ ...filters, [key]: value });
  }

  const activeCount = Object.values(filters).filter(Boolean).length;

  async function saveCurrentFilter() {
    if (!saveName.trim()) return;
    const res = await fetch("/api/saved-filters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page, name: saveName.trim(), filter: filters }),
    });
    if (res.ok) {
      const data = await res.json();
      setSavedFilters((prev) => [data.filter, ...prev]);
      setSaveName("");
      setShowSaveInput(false);
    }
  }

  async function deleteSavedFilter(id: string) {
    await fetch(`/api/saved-filters/${id}`, { method: "DELETE" });
    setSavedFilters((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-grey-400" />
        <Input
          value={filters.q}
          onChange={(e) => set("q", e.target.value)}
          placeholder="Search order #, notes, tracking…"
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={filters.status} onChange={(e) => set("status", e.target.value)} className="w-auto min-w-[150px]">
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <Select value={filters.urgency} onChange={(e) => set("urgency", e.target.value)} className="w-auto min-w-[130px]">
          <option value="">All Urgency</option>
          {URGENCY_LEVELS.map((u) => (
            <option key={u} value={u}>
              {URGENCY_LABELS[u]}
            </option>
          ))}
        </Select>
        {showAgent && (
          <Select value={filters.agentId} onChange={(e) => set("agentId", e.target.value)} className="w-auto min-w-[150px]">
            <option value="">All Agents</option>
            {options.agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        )}
        <Select value={filters.branchId} onChange={(e) => set("branchId", e.target.value)} className="w-auto min-w-[150px]">
          <option value="">All Branches</option>
          {options.branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
        <Select value={filters.categoryId} onChange={(e) => set("categoryId", e.target.value)} className="w-auto min-w-[160px]">
          <option value="">All Categories</option>
          {options.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={filters.supplierId} onChange={(e) => set("supplierId", e.target.value)} className="w-auto min-w-[150px]">
          <option value="">All Suppliers</option>
          {options.suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Select value={filters.deliveryMethod} onChange={(e) => set("deliveryMethod", e.target.value)} className="w-auto min-w-[160px]">
          <option value="">All Delivery Methods</option>
          {DELIVERY_METHODS.map((d) => (
            <option key={d} value={d}>
              {DELIVERY_METHOD_LABELS[d]}
            </option>
          ))}
        </Select>
        {showApprover && (
          <Select value={filters.approverRole} onChange={(e) => set("approverRole", e.target.value)} className="w-auto min-w-[150px]">
            <option value="">All Approvers</option>
            {MANAGER_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r as Role]}
              </option>
            ))}
          </Select>
        )}
        <Input type="date" value={filters.dateFrom} onChange={(e) => set("dateFrom", e.target.value)} className="w-auto" />
        <span className="text-xs text-grey-400">to</span>
        <Input type="date" value={filters.dateTo} onChange={(e) => set("dateTo", e.target.value)} className="w-auto" />

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_FILTERS)}>
            <X className="size-3.5" /> Clear ({activeCount})
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => setShowSaveInput((v) => !v)}>
          <BookmarkPlus className="size-3.5" /> Save Filter
        </Button>
      </div>

      {showSaveInput && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
          <Input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Filter name…" className="max-w-xs" />
          <Button size="sm" onClick={saveCurrentFilter}>
            Save
          </Button>
        </motion.div>
      )}

      {savedFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-grey-400">
            <Bookmark className="size-3" /> Saved:
          </span>
          {savedFilters.map((f) => (
            <span
              key={f.id}
              className="flex items-center gap-1.5 rounded-full bg-grey-100 py-1 pr-1 pl-3 text-xs text-navy-700"
            >
              <button onClick={() => onChange(JSON.parse(f.filterJson))} className="hover:text-orange-600">
                {f.name}
              </button>
              <button onClick={() => deleteSavedFilter(f.id)} className="rounded-full p-0.5 hover:bg-grey-200">
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function applyOrderFilters<T extends {
  status: string;
  urgency: string;
  deliveryMethod: string;
  createdAt: string;
  orderNumber: string;
  branchId: string | null;
  supplierId: string | null;
  agent: { id: string };
  items: { product: { categoryId: string } | null }[];
  approvals: { approverRole: string; required: boolean }[];
}>(orders: T[], filters: OrdersFilterState) {
  return orders.filter((o) => {
    if (filters.status && o.status !== filters.status) return false;
    if (filters.urgency && o.urgency !== filters.urgency) return false;
    if (filters.agentId && o.agent.id !== filters.agentId) return false;
    if (filters.branchId && o.branchId !== filters.branchId) return false;
    if (filters.supplierId && o.supplierId !== filters.supplierId) return false;
    if (filters.deliveryMethod && o.deliveryMethod !== filters.deliveryMethod) return false;
    if (filters.categoryId && !o.items.some((it) => it.product?.categoryId === filters.categoryId)) return false;
    if (filters.approverRole && !o.approvals.some((a) => a.approverRole === filters.approverRole && a.required)) return false;
    if (filters.dateFrom && new Date(o.createdAt) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(o.createdAt) > new Date(filters.dateTo + "T23:59:59")) return false;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      if (!o.orderNumber.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}
