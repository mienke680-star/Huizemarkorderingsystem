"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, Truck, User, ClipboardList, CornerDownLeft } from "lucide-react";
import { StatusBadge } from "@/components/domain/badges";

type Results = {
  orders: { id: string; orderNumber: string; status: string; agent: { name: string } }[];
  products: { id: string; name: string; category: { name: string } }[];
  suppliers: { id: string; name: string }[];
  agents: { id: string; name: string }[];
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) setResults(await res.json());
      setLoading(false);
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  const hasResults =
    results && (results.orders.length || results.products.length || results.suppliers.length || results.agents.length);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 w-full max-w-sm items-center gap-2 rounded-xl border border-grey-200 bg-grey-50 px-3.5 text-sm text-grey-400 transition-colors hover:border-orange-300 hover:bg-white"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search orders, agents, products…</span>
        <kbd className="hidden rounded-md border border-grey-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-grey-400 sm:block">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 360, damping: 32 }}
              className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-grey-100 bg-white shadow-soft-lg"
            >
              <div className="flex items-center gap-3 border-b border-grey-100 px-4 py-3.5">
                <Search className="size-4.5 text-grey-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search order number, agent, product, supplier…"
                  className="flex-1 text-sm text-navy-800 outline-none placeholder:text-grey-400"
                />
                {loading && <div className="size-4 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500" />}
              </div>

              <div className="max-h-96 overflow-y-auto p-2">
                {!query && <p className="p-6 text-center text-sm text-grey-400">Start typing to search across the platform.</p>}
                {query && query.trim().length < 2 && (
                  <p className="p-6 text-center text-sm text-grey-400">Keep typing…</p>
                )}
                {query.trim().length >= 2 && !loading && !hasResults && (
                  <p className="p-6 text-center text-sm text-grey-400">No results for &ldquo;{query}&rdquo;.</p>
                )}

                {results?.orders && results.orders.length > 0 && (
                  <div className="mb-2">
                    <p className="px-3 py-1.5 text-[11px] font-semibold tracking-wide text-grey-400 uppercase">Orders</p>
                    {results.orders.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => go(`/orders/${o.id}`)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-grey-50"
                      >
                        <ClipboardList className="size-4 text-grey-400" />
                        <span className="flex-1 text-sm text-navy-800">
                          {o.orderNumber} <span className="text-grey-400">· {o.agent.name}</span>
                        </span>
                        <StatusBadge status={o.status} />
                      </button>
                    ))}
                  </div>
                )}

                {results?.products && results.products.length > 0 && (
                  <div className="mb-2">
                    <p className="px-3 py-1.5 text-[11px] font-semibold tracking-wide text-grey-400 uppercase">Products</p>
                    {results.products.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => go(`/products`)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-grey-50"
                      >
                        <Package className="size-4 text-grey-400" />
                        <span className="text-sm text-navy-800">{p.name}</span>
                        <span className="text-xs text-grey-400">{p.category.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {results?.suppliers && results.suppliers.length > 0 && (
                  <div className="mb-2">
                    <p className="px-3 py-1.5 text-[11px] font-semibold tracking-wide text-grey-400 uppercase">Suppliers</p>
                    {results.suppliers.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => go(`/suppliers`)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-grey-50"
                      >
                        <Truck className="size-4 text-grey-400" />
                        <span className="text-sm text-navy-800">{s.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {results?.agents && results.agents.length > 0 && (
                  <div>
                    <p className="px-3 py-1.5 text-[11px] font-semibold tracking-wide text-grey-400 uppercase">Agents</p>
                    {results.agents.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => go(`/agents`)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-grey-50"
                      >
                        <User className="size-4 text-grey-400" />
                        <span className="text-sm text-navy-800">{a.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-1.5 border-t border-grey-100 px-4 py-2.5 text-[11px] text-grey-400">
                <CornerDownLeft className="size-3" /> to open · Esc to close
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
