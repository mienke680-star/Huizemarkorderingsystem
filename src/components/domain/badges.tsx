import { Badge, type BadgeTone } from "@/components/ui/badge";
import {
  ORDER_STATUS_LABELS,
  APPROVAL_STATUS_LABELS,
  URGENCY_LABELS,
  STOCK_STATUS_LABELS,
  type OrderStatus,
  type ApprovalStatus,
  type UrgencyLevel,
  type StockStatus,
} from "@/lib/constants";

const statusTone: Record<OrderStatus, BadgeTone> = {
  DRAFT: "grey",
  SUBMITTED: "blue",
  AWAITING_APPROVAL: "amber",
  CHANGES_REQUESTED: "amber",
  APPROVED: "green",
  ORDERED_FROM_SUPPLIER: "blue",
  SUPPLIER_CONFIRMED: "blue",
  ARTWORK_IN_PREPARATION: "orange",
  ARTWORK_APPROVED: "orange",
  IN_MANUFACTURING: "orange",
  QUALITY_CHECK: "orange",
  READY_FOR_COLLECTION: "green",
  RECEIVED_AT_OFFICE: "navy",
  BEING_PACKED: "navy",
  COURIER_BOOKED: "blue",
  BEING_COURIERED: "blue",
  OUT_FOR_DELIVERY: "blue",
  DELIVERED: "green",
  COLLECTED_BY_AGENT: "green",
  COMPLETED: "green",
  DECLINED: "red",
  CANCELLED: "red",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = status as OrderStatus;
  return (
    <Badge tone={statusTone[s] ?? "grey"} dot className={className}>
      {ORDER_STATUS_LABELS[s] ?? status}
    </Badge>
  );
}

const approvalTone: Record<ApprovalStatus, BadgeTone> = {
  AWAITING_REVIEW: "amber",
  APPROVED: "green",
  DECLINED: "red",
  CHANGES_REQUESTED: "orange",
  NOT_REQUIRED: "grey",
};

export function ApprovalStatusBadge({ status, className }: { status: string; className?: string }) {
  const s = status as ApprovalStatus;
  return (
    <Badge tone={approvalTone[s] ?? "grey"} dot className={className}>
      {APPROVAL_STATUS_LABELS[s] ?? status}
    </Badge>
  );
}

const urgencyTone: Record<UrgencyLevel, BadgeTone> = {
  NORMAL: "grey",
  PRIORITY: "blue",
  URGENT: "orange",
  CRITICAL: "red",
};

export function UrgencyBadge({ urgency, className }: { urgency: string; className?: string }) {
  const u = urgency as UrgencyLevel;
  return (
    <Badge tone={urgencyTone[u] ?? "grey"} className={className}>
      {URGENCY_LABELS[u] ?? urgency}
    </Badge>
  );
}

const stockTone: Record<StockStatus, BadgeTone> = {
  IN_STOCK: "green",
  LOW_STOCK: "amber",
  OUT_OF_STOCK: "red",
  MADE_TO_ORDER: "blue",
};

export function StockBadge({ status, className }: { status: string; className?: string }) {
  const s = status as StockStatus;
  return (
    <Badge tone={stockTone[s] ?? "grey"} className={className}>
      {STOCK_STATUS_LABELS[s] ?? status}
    </Badge>
  );
}
