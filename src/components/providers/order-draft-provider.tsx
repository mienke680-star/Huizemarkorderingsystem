"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { createBrowserStore } from "@/lib/browser-store";

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
const store = createBrowserStore<DraftItem[]>("local", "hm-order-draft-cart", []);

export function OrderDraftProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  function addItem(item: Omit<DraftItem, "key">) {
    store.set([...store.getSnapshot(), { ...item, key: crypto.randomUUID() }]);
  }
  function removeItem(key: string) {
    store.set(store.getSnapshot().filter((i) => i.key !== key));
  }
  function updateItem(key: string, patch: Partial<DraftItem>) {
    store.set(store.getSnapshot().map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }
  function clear() {
    store.set([]);
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
