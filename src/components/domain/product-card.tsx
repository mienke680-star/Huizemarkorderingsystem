"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Trash2, ShoppingCart, Clock, Layers, Check } from "lucide-react";
import { DynamicIcon } from "@/components/domain/dynamic-icon";
import { StockBadge } from "@/components/domain/badges";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export type CatalogueProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  priceOnRequest: boolean;
  productionTimeDays: number;
  minOrderQty: number;
  sizesJson: string;
  finishesJson: string;
  personalisationOptions: string;
  stockStatus: string;
  imageUrl: string | null;
  active: boolean;
  category: { id: string; name: string; icon: string };
  supplier: { id: string; name: string } | null;
};

function parseArr(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function ProductCard({
  product,
  isAdmin,
  onAddToOrder,
  onEdit,
  onDelete,
  delay = 0,
}: {
  product: CatalogueProduct;
  isAdmin: boolean;
  onAddToOrder: (p: CatalogueProduct) => void;
  onEdit?: (p: CatalogueProduct) => void;
  onDelete?: (p: CatalogueProduct) => void;
  delay?: number;
}) {
  const [added, setAdded] = useState(false);
  const sizes = parseArr(product.sizesJson);
  const finishes = parseArr(product.finishesJson);

  function handleAdd() {
    onAddToOrder(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(delay, 0.4), ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -5 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-grey-100 bg-white shadow-soft transition-shadow hover:shadow-soft-lg"
    >
      <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-navy-50 to-orange-50">
        <DynamicIcon name={product.category.icon} className="size-12 text-navy-300 transition-transform duration-300 group-hover:scale-110" />
        {!product.active && (
          <span className="absolute top-3 left-3 rounded-full bg-grey-800/80 px-2.5 py-1 text-[10px] font-semibold text-white">
            Inactive
          </span>
        )}
        {isAdmin && (
          <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => onEdit?.(product)}
              className="flex size-8 items-center justify-center rounded-full bg-white/90 text-navy-600 shadow-soft hover:bg-white"
              aria-label="Edit product"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              onClick={() => onDelete?.(product)}
              className="flex size-8 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-soft hover:bg-white"
              aria-label="Delete product"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold tracking-wide text-orange-600 uppercase">{product.category.name}</p>
        <h3 className="mt-0.5 font-display text-base font-semibold text-navy-800">{product.name}</h3>
        {product.description && <p className="mt-1.5 line-clamp-2 text-xs text-grey-500">{product.description}</p>}

        <div className="mt-3 flex flex-wrap gap-1.5">
          <StockBadge status={product.stockStatus} />
          {sizes.slice(0, 2).map((s) => (
            <span key={s} className="rounded-full bg-grey-100 px-2 py-1 text-[10px] font-medium text-grey-600">
              {s}
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-4 text-[11px] text-grey-500">
          <span className="flex items-center gap-1">
            <Clock className="size-3" /> {product.productionTimeDays}d production
          </span>
          <span className="flex items-center gap-1">
            <Layers className="size-3" /> Min {product.minOrderQty}
          </span>
        </div>

        {finishes.length > 0 && (
          <p className="mt-1.5 truncate text-[11px] text-grey-400">Finishes: {finishes.join(", ")}</p>
        )}
        {product.supplier && <p className="mt-1 truncate text-[11px] text-grey-400">Supplier: {product.supplier.name}</p>}

        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="font-display text-sm font-semibold text-navy-800">
            {product.priceOnRequest ? "Price on Request" : formatCurrency(product.price)}
          </span>
          <Button size="sm" variant={added ? "subtle" : "primary"} onClick={handleAdd} disabled={!product.active}>
            {added ? (
              <>
                <Check className="size-3.5" /> Added
              </>
            ) : (
              <>
                <ShoppingCart className="size-3.5" /> Add to Order
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
