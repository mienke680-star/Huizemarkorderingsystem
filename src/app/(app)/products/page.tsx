"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Plus, FolderPlus, Package } from "lucide-react";
import { toast } from "sonner";
import { ProductCard, type CatalogueProduct } from "@/components/domain/product-card";
import { ProductFormModal } from "@/components/domain/product-form-modal";
import { CategoryFormModal } from "@/components/domain/category-form-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DynamicIcon } from "@/components/domain/dynamic-icon";
import { Button } from "@/components/ui/button";
import { useOrderDraft } from "@/components/providers/order-draft-provider";
import { isAdmin } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; slug: string; icon: string; description: string | null; _count: { products: number } };
type Supplier = { id: string; name: string };

export default function ProductsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { addItem } = useOrderDraft();
  const admin = session?.user?.role ? isAdmin(session.user.role) : false;

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<CatalogueProduct[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [productModal, setProductModal] = useState<{ open: boolean; product: CatalogueProduct | null }>({
    open: false,
    product: null,
  });
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; category: Category | null }>({
    open: false,
    category: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<CatalogueProduct | null>(null);

  async function loadAll() {
    setLoading(true);
    const [catRes, prodRes, supRes] = await Promise.all([
      fetch("/api/categories"),
      fetch(`/api/products${admin ? "?includeInactive=true" : ""}`),
      fetch("/api/suppliers"),
    ]);
    const catData = await catRes.json();
    const prodData = await prodRes.json();
    const supData = await supRes.json();
    setCategories(catData.categories);
    setProducts(prodData.products);
    setSuppliers(supData.suppliers);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (activeCategory !== "all" && p.category.id !== activeCategory) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [products, activeCategory, search]);

  function handleAddToOrder(p: CatalogueProduct) {
    addItem({
      productId: p.id,
      name: p.name,
      categoryName: p.category.name,
      quantity: p.minOrderQty,
      unitPrice: p.price,
      priceOnRequest: p.priceOnRequest,
    });
    toast.success(`Added "${p.name}" to your order`, {
      action: { label: "Go to order form", onClick: () => router.push("/orders/new") },
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/products/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      const data = await res.json();
      toast.success(data.deactivated ? "Product deactivated (still referenced by orders)" : "Product deleted");
      setDeleteTarget(null);
      loadAll();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-orange-600">Order Catalogue</p>
          <h1 className="font-display text-2xl font-semibold text-navy-800 sm:text-3xl">Products & Services</h1>
          <p className="mt-1 text-sm text-grey-500">Browse everything available to order across Huizemark North Coast.</p>
        </div>
        {admin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCategoryModal({ open: true, category: null })}>
              <FolderPlus className="size-4" /> Add Category
            </Button>
            <Button onClick={() => setProductModal({ open: true, product: null })}>
              <Plus className="size-4" /> Add Product
            </Button>
          </div>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-grey-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="w-full rounded-xl border border-grey-200 bg-white py-2.5 pr-4 pl-10 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <CategoryPill
          active={activeCategory === "all"}
          onClick={() => setActiveCategory("all")}
          icon="LayoutGrid"
          label="All Categories"
          count={products.length}
          onEdit={admin ? undefined : undefined}
        />
        {categories.map((c) => (
          <CategoryPill
            key={c.id}
            active={activeCategory === c.id}
            onClick={() => setActiveCategory(c.id)}
            icon={c.icon}
            label={c.name}
            count={c._count.products}
            onEdit={admin ? () => setCategoryModal({ open: true, category: c }) : undefined}
          />
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton h-80 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-grey-200 py-20 text-center">
          <Package className="size-10 text-grey-300" />
          <p className="mt-3 text-sm font-medium text-navy-700">No products found</p>
          <p className="text-sm text-grey-400">Try a different category or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p, i) => (
            <ProductCard
              key={p.id}
              product={p}
              isAdmin={admin}
              onAddToOrder={handleAddToOrder}
              onEdit={(prod) => setProductModal({ open: true, product: prod })}
              onDelete={(prod) => setDeleteTarget(prod)}
              delay={i * 0.04}
            />
          ))}
        </div>
      )}

      <ProductFormModal
        open={productModal.open}
        onClose={() => setProductModal({ open: false, product: null })}
        onSaved={loadAll}
        categories={categories}
        suppliers={suppliers}
        product={productModal.product}
      />
      <CategoryFormModal
        open={categoryModal.open}
        onClose={() => setCategoryModal({ open: false, category: null })}
        onSaved={loadAll}
        category={categoryModal.category}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete "${deleteTarget?.name}"?`}
        description="If this product has been used in previous orders it will be deactivated instead of deleted, to preserve order history."
        confirmLabel="Delete"
      />
    </div>
  );
}

function CategoryPill({
  active,
  onClick,
  icon,
  label,
  count,
  onEdit,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  count: number;
  onEdit?: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      onDoubleClick={onEdit}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
        active
          ? "border-orange-500 bg-orange-500 text-white shadow-orange-glow"
          : "border-grey-200 bg-white text-navy-600 hover:border-orange-300 hover:text-orange-600"
      )}
    >
      <DynamicIcon name={icon} className="size-3.5" />
      {label}
      <span className={cn("rounded-full px-1.5 text-[10px]", active ? "bg-white/20" : "bg-grey-100 text-grey-500")}>
        {count}
      </span>
    </motion.button>
  );
}
