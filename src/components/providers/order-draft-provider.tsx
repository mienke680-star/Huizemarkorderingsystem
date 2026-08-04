"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type DraftItem = {
  key: string;
  productId: string | null;
  name: string;
  categoryName?: string;
  quantity: number;
  size?: string;
  colour?: string;
  material?: string;
  finish?: string;
  customWording?: string;
  unitPrice?: number | null;
  priceOnRequest?: boolean;
};

type OrderDraftContextValue = {
  items: DraftItem[];
  addItem: (item: Omit<DraftItem, "key">) => void;
  removeItem: (key: string) => void;
  updateItem: (key: string, patch: Partial<DraftItem>) => void;
  clear: () => void;
};

const OrderDraftContext = createContext<OrderDraftContextValue | null>(null);
const STORAGE_KEY = "hm-order-draft-cart";

export function OrderDraftProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<DraftItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {
      // ignore malformed cart state
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  function addItem(item: Omit<DraftItem, "key">) {
    setItems((prev) => [...prev, { ...item, key: crypto.randomUUID() }]);
  }
  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }
  function updateItem(key: string, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }
  function clear() {
    setItems([]);
  }

  return (
    <OrderDraftContext.Provider value={{ items, addItem, removeItem, updateItem, clear }}>
      {children}
    </OrderDraftContext.Provider>
  );
}

export function useOrderDraft() {
  const ctx = useContext(OrderDraftContext);
  if (!ctx) throw new Error("useOrderDraft must be used within OrderDraftProvider");
  return ctx;
}
