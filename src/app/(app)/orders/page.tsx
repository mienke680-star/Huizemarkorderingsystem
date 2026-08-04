"use client";

import { useEffect, useMemo, useState } from "react";
import { OrdersTable, type OrderRow } from "@/components/domain/orders-table";
import { OrdersFilterBar, EMPTY_FILTERS, applyOrderFilters, type OrdersFilterState } from "@/components/domain/orders-filter-bar";

export default function AllOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OrdersFilterState>(EMPTY_FILTERS);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/orders").then((r) => r.json()),
      fetch("/api/agents").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/branches").then((r) => r.json()),
      fetch("/api/suppliers").then((r) => r.json()),
    ]).then(([o, a, c, b, s]) => {
      setOrders(o.orders);
      setAgents(a.agents ?? []);
      setCategories(c.categories);
      setBranches(b.branches);
      setSuppliers(s.suppliers);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => applyOrderFilters(orders, filters), [orders, filters]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-orange-600">All Orders</p>
        <h1 className="font-display text-2xl font-semibold text-navy-800 sm:text-3xl">Every Order, Company-Wide</h1>
        <p className="mt-1 text-sm text-grey-500">{filtered.length} order{filtered.length === 1 ? "" : "s"} matching your filters.</p>
      </div>

      <OrdersFilterBar
        page="all-orders"
        filters={filters}
        onChange={setFilters}
        options={{ agents, branches, categories, suppliers }}
        showAgent
        showApprover
      />

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      ) : (
        <OrdersTable orders={filtered} />
      )}
    </div>
  );
}
