"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Check, X, MessageSquareWarning } from "lucide-react";
import { TIMELINE_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";

export function ApprovalDecisionModal({
  open,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (decision: "APPROVED" | "DECLINED" | "CHANGES_REQUESTED", comment: string) => void;
  loading: boolean;
}) {
  const [decision, setDecision] = useState<"APPROVED" | "DECLINED" | "CHANGES_REQUESTED" | null>(null);
  const [comment, setComment] = useState("");

  return (
    <Modal
      open={open}
      onClose={() => {
        setDecision(null);
        setComment("");
        onClose();
      }}
      title="Review This Order"
      description="Approve, decline, or request changes before this order can proceed."
    >
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setDecision("APPROVED")}
          className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 text-sm font-medium transition-colors ${
            decision === "APPROVED" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-grey-200 text-grey-500 hover:border-grey-300"
          }`}
        >
          <Check className="size-4" /> Approve
        </button>
        <button
          onClick={() => setDecision("CHANGES_REQUESTED")}
          className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 text-sm font-medium transition-colors ${
            decision === "CHANGES_REQUESTED" ? "border-orange-500 bg-orange-50 text-orange-700" : "border-grey-200 text-grey-500 hover:border-grey-300"
          }`}
        >
          <MessageSquareWarning className="size-4" /> Request Changes
        </button>
        <button
          onClick={() => setDecision("DECLINED")}
          className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 text-sm font-medium transition-colors ${
            decision === "DECLINED" ? "border-red-500 bg-red-50 text-red-700" : "border-grey-200 text-grey-500 hover:border-grey-300"
          }`}
        >
          <X className="size-4" /> Decline
        </button>
      </div>

      <div className="mt-4">
        <Label>Comment {decision === "DECLINED" || decision === "CHANGES_REQUESTED" ? "(required)" : "(optional)"}</Label>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add context for the agent…" />
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          loading={loading}
          disabled={!decision || ((decision === "DECLINED" || decision === "CHANGES_REQUESTED") && !comment.trim())}
          onClick={() => decision && onSubmit(decision, comment.trim())}
        >
          Confirm
        </Button>
      </div>
    </Modal>
  );
}

export function StatusUpdateModal({
  open,
  onClose,
  onSubmit,
  currentStatus,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { status: string; note: string; estimatedCompletionDate: string }) => void;
  currentStatus: string;
  loading: boolean;
}) {
  const currentIdx = TIMELINE_STATUSES.indexOf(currentStatus as OrderStatus);
  const [status, setStatus] = useState(TIMELINE_STATUSES[Math.min(currentIdx + 1, TIMELINE_STATUSES.length - 1)]);
  const [note, setNote] = useState("");
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");

  return (
    <Modal open={open} onClose={onClose} title="Update Order Status" size="sm">
      <div className="space-y-4">
        <div>
          <Label>New Status</Label>
          <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
            {TIMELINE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>
        <div>
          <Label>Note (optional)</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div>
          <Label>Estimated Completion Date (optional)</Label>
          <Input type="date" value={estimatedCompletionDate} onChange={(e) => setEstimatedCompletionDate(e.target.value)} />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button loading={loading} onClick={() => onSubmit({ status, note, estimatedCompletionDate })}>
          Update Status
        </Button>
      </div>
    </Modal>
  );
}

export function AssignSupplierModal({
  open,
  onClose,
  onSubmit,
  suppliers,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (supplierId: string) => void;
  suppliers: { id: string; name: string }[];
  loading: boolean;
}) {
  const [supplierId, setSupplierId] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="Assign Supplier" size="sm">
      <Label>Supplier</Label>
      <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
        <option value="">Select a supplier…</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button loading={loading} disabled={!supplierId} onClick={() => onSubmit(supplierId)}>
          Assign
        </Button>
      </div>
    </Modal>
  );
}

export function BookCourierModal({
  open,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { courierName: string; trackingNumber: string }) => void;
  loading: boolean;
}) {
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="Book Courier" size="sm">
      <div className="space-y-4">
        <div>
          <Label>Courier Company</Label>
          <Input value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="e.g. Dolphin Coast Couriers" />
        </div>
        <div>
          <Label>Tracking Number</Label>
          <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          loading={loading}
          disabled={!courierName || !trackingNumber}
          onClick={() => onSubmit({ courierName, trackingNumber })}
        >
          Book Courier
        </Button>
      </div>
    </Modal>
  );
}
