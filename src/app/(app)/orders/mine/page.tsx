"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrdersTable, type OrderRow } from "@/components/domain/orders-table";
import { OrdersFilterBar, EMPTY_FILTERS, applyOrderFilters, type OrdersFilterState } from "@/components/domain/orders-filter-bar";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OrdersFilterState>(EMPTY_FILTERS);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/orders?mine=true").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/branches").then((r) => r.json()),
      fetch("/api/suppliers").then((r) => r.json()),
    ]).then(([o, c, b, s]) => {
      setOrders(o.orders);
      setCategories(c.categories);
      setBranches(b.branches);
      setSuppliers(s.suppliers);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => applyOrderFilters(orders, filters), [orders, filters]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-orange-600">My Orders</p>
          <h1 className="font-display text-2xl font-semibold text-navy-800 sm:text-3xl">Your Order History</h1>
          <p className="mt-1 text-sm text-grey-500">Every order you&apos;ve created, drafted or submitted.</p>
        </div>
        <Link href="/orders/new">
          <Button>
            <PlusCircle className="size-4" /> New Order
          </Button>
        </Link>
      </div>

      <OrdersFilterBar
        page="orders-mine"
        filters={filters}
        onChange={setFilters}
        options={{ agents: [], branches, categories, suppliers }}
        showAgent={false}
      />

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      ) : (
        <OrdersTable orders={filtered} showAgent={false} />
      )}
    </div>
  );
}
