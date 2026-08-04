"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Copy,
  Printer,
  Archive,
  ArchiveRestore,
  Ban,
  Pencil,
  ShieldCheck,
  Truck as TruckIcon,
  PackageCheck,
  RotateCcw,
  Upload,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/input";
import { StatusBadge, UrgencyBadge } from "@/components/domain/badges";
import { ApprovalProgress, type ApprovalRow } from "@/components/domain/approval-progress";
import { StatusTimeline, type HistoryEntry } from "@/components/domain/status-timeline";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ApprovalDecisionModal,
  StatusUpdateModal,
  AssignSupplierModal,
  BookCourierModal,
} from "@/components/domain/order-action-modals";
import { formatCurrency, formatDate, formatDateTime, timeAgo } from "@/lib/utils";
import {
  DELIVERY_METHOD_LABELS,
  URGENCY_LABELS,
  FILE_KIND_LABELS,
  isAdmin,
  canSeeAllOrders,
  type FileKind,
} from "@/lib/constants";

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  urgency: string;
  deliveryMethod: string;
  deliveryAddress: string | null;
  requiredDate: string | null;
  estimatedCompletionDate: string | null;
  completedAt: string | null;
  agentContact: string | null;
  motivation: string | null;
  costCentre: string | null;
  notes: string | null;
  supplierPreference: string | null;
  estimatedCost: number;
  actualCost: number | null;
  trackingNumber: string | null;
  courierName: string | null;
  archived: boolean;
  createdAt: string;
  submittedAt: string | null;
  agent: { id: string; name: string; initials: string; avatarColor: string; email: string; phone: string | null; branch: { name: string } | null };
  branch: { name: string } | null;
  supplier: { id: string; name: string } | null;
  items: {
    id: string;
    productNameSnapshot: string;
    quantity: number;
    size: string | null;
    colour: string | null;
    material: string | null;
    finish: string | null;
    customWording: string | null;
    unitPriceEstimate: number;
    lineTotalEstimate: number;
    product: { name: string; category: { name: string } } | null;
  }[];
  approvals: ApprovalRow[];
  statusHistory: HistoryEntry[];
  files: { id: string; fileName: string; fileUrl: string; fileKind: string; createdAt: string; uploadedBy: { name: string } | null }[];
  comments: { id: string; body: string; internal: boolean; createdAt: string; user: { name: string; initials: string; avatarColor: string; role: string } }[];
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [comment, setComment] = useState("");
  const [internalNote, setInternalNote] = useState(false);
  const [posting, setPosting] = useState(false);

  const [approvalModal, setApprovalModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [supplierModal, setSupplierModal] = useState(false);
  const [courierModal, setCourierModal] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/orders/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setOrder(data.order);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    load();
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((d) => setSuppliers(d.suppliers ?? []));
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-24 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }
  if (!order || !session?.user) {
    return <p className="py-20 text-center text-sm text-grey-400">Order not found.</p>;
  }

  const role = session.user.role;
  const seeAll = canSeeAllOrders(role);
  const isOwner = order.agent.id === session.user.id;
  const myApproval = order.approvals.find((a) => a.approverRole === role);
  const canReview = myApproval?.required && myApproval.status === "AWAITING_REVIEW" && ["AWAITING_APPROVAL", "SUBMITTED"].includes(order.status);
  const canEdit = isOwner && ["DRAFT", "CHANGES_REQUESTED"].includes(order.status);
  const canCancel = isOwner && !["COMPLETED", "CANCELLED", "DECLINED"].includes(order.status);
  const statusIdx = ["DRAFT","SUBMITTED","AWAITING_APPROVAL","CHANGES_REQUESTED","APPROVED","ORDERED_FROM_SUPPLIER","SUPPLIER_CONFIRMED","ARTWORK_IN_PREPARATION","ARTWORK_APPROVED","IN_MANUFACTURING","QUALITY_CHECK","READY_FOR_COLLECTION","RECEIVED_AT_OFFICE","BEING_PACKED","COURIER_BOOKED","BEING_COURIERED","OUT_FOR_DELIVERY","DELIVERED","COLLECTED_BY_AGENT","COMPLETED"].indexOf(order.status);

  async function handleApprovalDecision(decision: "APPROVED" | "DECLINED" | "CHANGES_REQUESTED", commentText: string) {
    setActionLoading(true);
    const res = await fetch(`/api/orders/${order!.id}/approvals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, comment: commentText }),
    });
    setActionLoading(false);
    if (res.ok) {
      toast.success(decision === "APPROVED" ? "Approval recorded" : decision === "DECLINED" ? "Order declined" : "Changes requested");
      setApprovalModal(false);
      load();
    } else {
      const d = await res.json();
      toast.error(d.error || "Something went wrong.");
    }
  }

  async function handleStatusUpdate(data: { status: string; note: string; estimatedCompletionDate: string }) {
    setActionLoading(true);
    const res = await fetch(`/api/orders/${order!.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setActionLoading(false);
    if (res.ok) {
      toast.success("Order status updated");
      setStatusModal(false);
      load();
    } else {
      const d = await res.json();
      toast.error(d.error || "Something went wrong.");
    }
  }

  async function quickStatus(status: string) {
    setActionLoading(true);
    const res = await fetch(`/api/orders/${order!.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setActionLoading(false);
    if (res.ok) {
      toast.success("Order status updated");
      load();
    } else {
      const d = await res.json();
      toast.error(d.error || "Something went wrong.");
    }
  }

  async function handleCancel() {
    setActionLoading(true);
    const res = await fetch(`/api/orders/${order!.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED", note: "Cancelled by agent." }),
    });
    setActionLoading(false);
    setCancelConfirm(false);
    if (res.ok) {
      toast.success("Order cancelled");
      load();
    } else {
      const d = await res.json();
      toast.error(d.error || "Something went wrong.");
    }
  }

  async function handleAssignSupplier(supplierId: string) {
    setActionLoading(true);
    const res = await fetch(`/api/orders/${order!.id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierId }),
    });
    setActionLoading(false);
    if (res.ok) {
      toast.success("Supplier assigned");
      setSupplierModal(false);
      load();
    }
  }

  async function handleBookCourier(data: { courierName: string; trackingNumber: string }) {
    setActionLoading(true);
    const res = await fetch(`/api/orders/${order!.id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setActionLoading(false);
    if (res.ok) {
      toast.success("Courier booked");
      setCourierModal(false);
      load();
    }
  }

  async function handleDuplicate() {
    const res = await fetch(`/api/orders/${order!.id}/duplicate`, { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      toast.success("Order duplicated as a new draft");
      router.push(`/orders/${d.order.id}`);
    }
  }

  async function handleArchive() {
    const res = await fetch(`/api/orders/${order!.id}/archive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: !order!.archived }),
    });
    if (res.ok) {
      toast.success(order!.archived ? "Order restored" : "Order archived");
      load();
    }
  }

  async function submitComment() {
    if (!comment.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/orders/${order!.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: comment, internal: internalNote }),
    });
    setPosting(false);
    if (res.ok) {
      setComment("");
      setInternalNote(false);
      load();
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const uploadRes = await fetch("/api/uploads", { method: "POST", body: fd });
    if (!uploadRes.ok) return;
    const uploaded = await uploadRes.json();
    await fetch(`/api/orders/${order!.id}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: uploaded.url, name: uploaded.name, kind: "DOCUMENT" }),
    });
    toast.success("File uploaded");
    load();
    e.target.value = "";
  }

  const filesByKind = order.files.reduce<Record<string, OrderDetail["files"]>>((acc, f) => {
    (acc[f.fileKind] ??= []).push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <p className="font-display text-2xl font-semibold text-navy-800 sm:text-3xl">{order.orderNumber}</p>
              <StatusBadge status={order.status} />
              <UrgencyBadge urgency={order.urgency} />
            </div>
            <p className="mt-1 flex items-center gap-2 text-sm text-grey-500">
              <Avatar initials={order.agent.initials} color={order.agent.avatarColor} size="xs" />
              {order.agent.name} · {order.agent.branch?.name ?? "—"} · Submitted {order.submittedAt ? timeAgo(order.submittedAt) : "not yet"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canReview && (
              <Button onClick={() => setApprovalModal(true)}>
                <ShieldCheck className="size-4" /> Review Order
              </Button>
            )}
            {canEdit && (
              <Button variant="outline" onClick={() => router.push(`/orders/new?edit=${order.id}`)}>
                <Pencil className="size-4" /> Edit Order
              </Button>
            )}
            {seeAll && (
              <Button variant="outline" onClick={() => setStatusModal(true)}>
                <Send className="size-4" /> Update Status
              </Button>
            )}
            {seeAll && (
              <Button variant="outline" onClick={() => setSupplierModal(true)}>
                Assign Supplier
              </Button>
            )}
            {seeAll && (
              <Button variant="outline" onClick={() => setCourierModal(true)}>
                <TruckIcon className="size-4" /> Book Courier
              </Button>
            )}
            {seeAll && statusIdx >= 0 && order.status !== "RECEIVED_AT_OFFICE" && (
              <Button variant="ghost" size="sm" onClick={() => quickStatus("RECEIVED_AT_OFFICE")}>
                Mark Received
              </Button>
            )}
            {seeAll && (
              <Button variant="ghost" size="sm" onClick={() => quickStatus("DELIVERED")}>
                <PackageCheck className="size-4" /> Mark Delivered
              </Button>
            )}
            <Button variant="outline" onClick={handleDuplicate}>
              <Copy className="size-4" /> Duplicate
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="size-4" /> Download Summary
            </Button>
            {canCancel && (
              <Button variant="ghost" size="sm" onClick={() => setCancelConfirm(true)} className="text-red-600 hover:bg-red-50">
                <Ban className="size-4" /> Cancel Order
              </Button>
            )}
            {isAdmin(role) && (
              <Button variant="ghost" size="sm" onClick={handleArchive}>
                {order.archived ? <RotateCcw className="size-4" /> : <Archive className="size-4" />}
                {order.archived ? "Restore" : "Archive"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-grey-100 text-left text-xs text-grey-400">
                    <th className="pb-2 font-medium">Item</th>
                    <th className="pb-2 font-medium">Specs</th>
                    <th className="pb-2 font-medium">Qty</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it) => (
                    <tr key={it.id} className="border-b border-grey-50 last:border-0">
                      <td className="py-3 font-medium text-navy-800">
                        {it.productNameSnapshot}
                        {it.product && <p className="text-xs font-normal text-grey-400">{it.product.category.name}</p>}
                      </td>
                      <td className="py-3 text-xs text-grey-500">
                        {[it.size, it.colour, it.material, it.finish].filter(Boolean).join(" · ") || "—"}
                        {it.customWording && <p className="italic">&ldquo;{it.customWording}&rdquo;</p>}
                      </td>
                      <td className="py-3 text-navy-700">{it.quantity}</td>
                      <td className="py-3 text-right font-medium text-navy-800">{formatCurrency(it.lineTotalEstimate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex justify-end gap-8 border-t border-grey-100 pt-3 text-sm">
                <div>
                  <p className="text-grey-400">Estimated Cost</p>
                  <p className="font-display text-lg font-semibold text-navy-800">{formatCurrency(order.estimatedCost)}</p>
                </div>
                {order.actualCost !== null && (
                  <div>
                    <p className="text-grey-400">Actual Cost</p>
                    <p className="font-display text-lg font-semibold text-navy-800">{formatCurrency(order.actualCost)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ApprovalProgress approvals={order.approvals} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline status={order.status} history={order.statusHistory} />
            </CardContent>
          </Card>

          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Files & Artwork</CardTitle>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700">
                <Upload className="size-3.5" /> Upload
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
            </CardHeader>
            <CardContent>
              {order.files.length === 0 ? (
                <p className="text-sm text-grey-400">No files uploaded yet.</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(filesByKind).map(([kind, files]) => (
                    <div key={kind}>
                      <p className="mb-1.5 text-xs font-semibold tracking-wide text-grey-400 uppercase">
                        {FILE_KIND_LABELS[kind as FileKind] ?? kind}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {files.map((f) => (
                          <a
                            key={f.id}
                            href={f.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-grey-200 px-3 py-1.5 text-xs text-navy-700 hover:border-orange-300 hover:text-orange-600"
                          >
                            {f.fileName}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Notes & Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.comments.length === 0 && <p className="text-sm text-grey-400">No comments yet.</p>}
                {order.comments.map((c) => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                    <Avatar initials={c.user.initials} color={c.user.avatarColor} size="sm" />
                    <div className="flex-1 rounded-xl bg-grey-50 p-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-navy-800">{c.user.name}</p>
                        {c.internal && (
                          <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-semibold text-navy-600">
                            Internal
                          </span>
                        )}
                        <p className="text-[11px] text-grey-400">{timeAgo(c.createdAt)}</p>
                      </div>
                      <p className="mt-1 text-sm text-navy-700">{c.body}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment before final approval…"
                />
                <div className="mt-2 flex items-center justify-between">
                  {seeAll ? (
                    <label className="flex items-center gap-2 text-xs text-grey-500">
                      <input type="checkbox" checked={internalNote} onChange={(e) => setInternalNote(e.target.checked)} className="rounded" />
                      Internal note (not visible to agent)
                    </label>
                  ) : (
                    <span />
                  )}
                  <Button size="sm" onClick={submitComment} loading={posting} disabled={!comment.trim()}>
                    Post
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Branch / Office" value={order.branch?.name ?? "—"} />
              <Row label="Delivery Method" value={DELIVERY_METHOD_LABELS[order.deliveryMethod as keyof typeof DELIVERY_METHOD_LABELS] ?? order.deliveryMethod} />
              {order.deliveryAddress && <Row label="Delivery Address" value={order.deliveryAddress} />}
              <Row label="Urgency" value={URGENCY_LABELS[order.urgency as keyof typeof URGENCY_LABELS] ?? order.urgency} />
              <Row label="Required Date" value={formatDate(order.requiredDate)} />
              <Row label="Est. Completion" value={formatDate(order.estimatedCompletionDate)} />
              {order.completedAt && <Row label="Actual Completion" value={formatDate(order.completedAt)} />}
              <Row label="Supplier" value={order.supplier?.name ?? "Not yet assigned"} />
              {order.trackingNumber && <Row label="Tracking Number" value={order.trackingNumber} />}
              {order.courierName && <Row label="Courier" value={order.courierName} />}
              <Row label="Cost Centre" value={order.costCentre ?? "—"} />
              <Row label="Agent Contact" value={order.agentContact ?? order.agent.email} />
              {order.motivation && <Row label="Motivation" value={order.motivation} />}
              {order.notes && <Row label="Notes" value={order.notes} />}
              <Row label="Created" value={formatDateTime(order.createdAt)} />
            </CardContent>
          </Card>
        </div>
      </div>

      <ApprovalDecisionModal
        open={approvalModal}
        onClose={() => setApprovalModal(false)}
        onSubmit={handleApprovalDecision}
        loading={actionLoading}
      />
      <StatusUpdateModal
        open={statusModal}
        onClose={() => setStatusModal(false)}
        onSubmit={handleStatusUpdate}
        currentStatus={order.status}
        loading={actionLoading}
      />
      <AssignSupplierModal
        open={supplierModal}
        onClose={() => setSupplierModal(false)}
        onSubmit={handleAssignSupplier}
        suppliers={suppliers}
        loading={actionLoading}
      />
      <BookCourierModal open={courierModal} onClose={() => setCourierModal(false)} onSubmit={handleBookCourier} loading={actionLoading} />
      <ConfirmDialog
        open={cancelConfirm}
        onClose={() => setCancelConfirm(false)}
        onConfirm={handleCancel}
        title="Cancel this order?"
        description="This order will be marked as cancelled and cannot be reopened."
        confirmLabel="Cancel Order"
        loading={actionLoading}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-grey-50 pb-2 last:border-0">
      <span className="shrink-0 text-grey-400">{label}</span>
      <span className="text-right font-medium text-navy-800">{value}</span>
    </div>
  );
}
