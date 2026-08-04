"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Star, Phone, Mail, MessageCircle, MapPin, Plus, Pencil, Trash2, Clock, Package, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SupplierFormModal, type SupplierRecord } from "@/components/domain/supplier-form-modal";
import { StatusBadge } from "@/components/domain/badges";
import { formatCurrency, formatDate } from "@/lib/utils";
import { isAdmin } from "@/lib/constants";

type Supplier = SupplierRecord & { _count: { products: number; orders: number } };
type SupplierOrder = { id: string; orderNumber: string; status: string; estimatedCost: number; createdAt: string; agent: { name: string } };

export default function SuppliersPage() {
  const { data: session } = useSession();
  const admin = session?.user?.role ? isAdmin(session.user.role) : false;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [formModal, setFormModal] = useState<{ open: boolean; supplier: Supplier | null }>({ open: false, supplier: null });
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null);
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/suppliers");
    const data = await res.json();
    setSuppliers(data.suppliers);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function openDetail(s: Supplier) {
    setDetailSupplier(s);
    const res = await fetch(`/api/orders?supplierId=${s.id}`);
    if (res.ok) {
      const data = await res.json();
      setSupplierOrders(data.orders);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/suppliers/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      const data = await res.json();
      toast.success(data.deactivated ? "Supplier deactivated (still linked to products)" : "Supplier deleted");
      setDeleteTarget(null);
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-orange-600">Suppliers</p>
          <h1 className="font-display text-2xl font-semibold text-navy-800 sm:text-3xl">Supplier Directory</h1>
          <p className="mt-1 text-sm text-grey-500">Manage the suppliers Huizemark North Coast orders from.</p>
        </div>
        {admin && (
          <Button onClick={() => setFormModal({ open: true, supplier: null })}>
            <Plus className="size-4" /> Add Supplier
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-56 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.4) }}
              whileHover={{ y: -4 }}
              className="cursor-pointer rounded-2xl border border-grey-100 bg-white p-5 shadow-soft transition-shadow hover:shadow-soft-lg"
              onClick={() => openDetail(s)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-base font-semibold text-navy-800">{s.name}</h3>
                  <p className="text-xs text-grey-400">{s.contactPerson ?? "No contact person set"}</p>
                </div>
                <Badge tone={s.active ? "green" : "grey"}>{s.active ? "Active" : "Inactive"}</Badge>
              </div>

              <div className="mt-3 flex items-center gap-1">
                {[...Array(5)].map((_, star) => (
                  <Star
                    key={star}
                    className={`size-3.5 ${star < Math.round(s.rating) ? "fill-orange-400 text-orange-400" : "text-grey-200"}`}
                  />
                ))}
                <span className="ml-1 text-xs text-grey-400">{s.rating.toFixed(1)}</span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-grey-500">
                {s.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="size-3" /> {s.phone}
                  </p>
                )}
                {s.email && (
                  <p className="flex items-center gap-1.5">
                    <Mail className="size-3" /> {s.email}
                  </p>
                )}
                {s.address && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="size-3" /> {s.address}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-grey-100 pt-3 text-xs text-grey-500">
                <span className="flex items-center gap-1">
                  <Clock className="size-3" /> {s.avgTurnaroundDays}d turnaround
                </span>
                <span className="flex items-center gap-1">
                  <Package className="size-3" /> {s._count.products} products
                </span>
                <span className="flex items-center gap-1">
                  <ClipboardList className="size-3" /> {s._count.orders} orders
                </span>
              </div>

              {admin && (
                <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" onClick={() => setFormModal({ open: true, supplier: s })}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(s)} className="text-red-600 hover:bg-red-50">
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <SupplierFormModal
        open={formModal.open}
        onClose={() => setFormModal({ open: false, supplier: null })}
        onSaved={load}
        supplier={formModal.supplier}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete "${deleteTarget?.name}"?`}
        description="If this supplier is linked to products it will be deactivated instead of deleted."
        confirmLabel="Delete"
      />

      <Sheet open={!!detailSupplier} onClose={() => setDetailSupplier(null)} title={detailSupplier?.name}>
        {detailSupplier && (
          <div className="space-y-5">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, star) => (
                <Star
                  key={star}
                  className={`size-4 ${star < Math.round(detailSupplier.rating) ? "fill-orange-400 text-orange-400" : "text-grey-200"}`}
                />
              ))}
              <span className="ml-1 text-sm text-grey-500">{detailSupplier.rating.toFixed(1)} rating</span>
            </div>
            <div className="space-y-2 text-sm">
              {detailSupplier.contactPerson && <p><span className="text-grey-400">Contact:</span> {detailSupplier.contactPerson}</p>}
              {detailSupplier.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="size-3.5 text-grey-400" /> {detailSupplier.phone}
                </p>
              )}
              {detailSupplier.whatsapp && (
                <p className="flex items-center gap-2">
                  <MessageCircle className="size-3.5 text-grey-400" /> {detailSupplier.whatsapp}
                </p>
              )}
              {detailSupplier.email && (
                <p className="flex items-center gap-2">
                  <Mail className="size-3.5 text-grey-400" /> {detailSupplier.email}
                </p>
              )}
              {detailSupplier.address && (
                <p className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-grey-400" /> {detailSupplier.address}
                </p>
              )}
              {detailSupplier.notes && <p className="rounded-lg bg-grey-50 p-3 text-xs text-grey-600">{detailSupplier.notes}</p>}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-grey-400 uppercase">Order History</p>
              {supplierOrders.length === 0 ? (
                <p className="text-sm text-grey-400">No orders yet.</p>
              ) : (
                <div className="space-y-2">
                  {supplierOrders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between rounded-lg border border-grey-100 p-2.5 text-xs">
                      <div>
                        <p className="font-medium text-navy-800">{o.orderNumber}</p>
                        <p className="text-grey-400">
                          {o.agent.name} · {formatDate(o.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={o.status} />
                        <span className="font-medium text-navy-700">{formatCurrency(o.estimatedCost)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
