// Central "enum" definitions shared by the DB layer (SQLite stores these as
// plain strings), the API layer, and the UI. Keep this file as the single
// source of truth for every closed set of values in the app.

export const ROLES = [
  "AGENT",
  "MIENKE",
  "MJ",
  "NADIA",
  "CHANTAL",
  "ADMIN",
] as const;
export type Role = (typeof ROLES)[number];

export const MANAGER_ROLES: Role[] = ["MIENKE", "MJ", "NADIA", "CHANTAL"];

export const ROLE_LABELS: Record<Role, string> = {
  AGENT: "Agent",
  MIENKE: "Mienke",
  MJ: "MJ",
  NADIA: "Nadia",
  CHANTAL: "Chantal",
  ADMIN: "Administrator",
};

export const ROLE_DASHBOARD_LABEL: Record<Role, string> = {
  AGENT: "Agent Dashboard",
  MIENKE: "Approvals Dashboard",
  MJ: "Approvals Dashboard",
  NADIA: "Approvals Dashboard",
  CHANTAL: "Approvals Dashboard",
  ADMIN: "Administrator Dashboard",
};

// ---------------------------------------------------------------------------
// Order status workflow (ordered — index = pipeline position)
// ---------------------------------------------------------------------------

export const ORDER_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "AWAITING_APPROVAL",
  "CHANGES_REQUESTED",
  "APPROVED",
  "ORDERED_FROM_SUPPLIER",
  "SUPPLIER_CONFIRMED",
  "ARTWORK_IN_PREPARATION",
  "ARTWORK_APPROVED",
  "IN_MANUFACTURING",
  "QUALITY_CHECK",
  "READY_FOR_COLLECTION",
  "RECEIVED_AT_OFFICE",
  "BEING_PACKED",
  "COURIER_BOOKED",
  "BEING_COURIERED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COLLECTED_BY_AGENT",
  "COMPLETED",
  "DECLINED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// The "happy path" timeline shown on the order detail page excludes the two
// terminal exception states (DECLINED / CANCELLED), which are surfaced as
// banners instead.
export const TIMELINE_STATUSES: OrderStatus[] = ORDER_STATUSES.filter(
  (s) => s !== "DECLINED" && s !== "CANCELLED"
);

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  AWAITING_APPROVAL: "Awaiting Approval",
  CHANGES_REQUESTED: "Changes Requested",
  APPROVED: "Approved",
  ORDERED_FROM_SUPPLIER: "Ordered from Supplier",
  SUPPLIER_CONFIRMED: "Supplier Confirmed",
  ARTWORK_IN_PREPARATION: "Artwork in Preparation",
  ARTWORK_APPROVED: "Artwork Approved",
  IN_MANUFACTURING: "In Manufacturing",
  QUALITY_CHECK: "Quality Check",
  READY_FOR_COLLECTION: "Ready for Collection",
  RECEIVED_AT_OFFICE: "Received at Office",
  BEING_PACKED: "Being Packed",
  COURIER_BOOKED: "Courier Booked",
  BEING_COURIERED: "Being Couriered",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  COLLECTED_BY_AGENT: "Collected by Agent",
  COMPLETED: "Completed",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
};

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  DRAFT: "Order is being prepared and has not been submitted yet.",
  SUBMITTED: "Order has been submitted and is entering the approval queue.",
  AWAITING_APPROVAL: "Waiting on one or more managers to review the order.",
  CHANGES_REQUESTED: "A manager asked for changes before it can proceed.",
  APPROVED: "All required approvals are complete.",
  ORDERED_FROM_SUPPLIER: "Order has been placed with the supplier.",
  SUPPLIER_CONFIRMED: "Supplier confirmed the order and timeline.",
  ARTWORK_IN_PREPARATION: "Artwork is being designed or prepared.",
  ARTWORK_APPROVED: "Artwork has been signed off.",
  IN_MANUFACTURING: "Item is being manufactured or printed.",
  QUALITY_CHECK: "Finished goods are being quality checked.",
  READY_FOR_COLLECTION: "Ready to be collected from the supplier.",
  RECEIVED_AT_OFFICE: "Stock has arrived at the Huizemark office.",
  BEING_PACKED: "Order is being packed for dispatch.",
  COURIER_BOOKED: "A courier has been booked for delivery.",
  BEING_COURIERED: "Order is in transit with the courier.",
  OUT_FOR_DELIVERY: "Courier is out for final delivery.",
  DELIVERED: "Order has been delivered.",
  COLLECTED_BY_AGENT: "Order was collected by the agent.",
  COMPLETED: "Order is fully complete.",
  DECLINED: "Order was declined by a manager.",
  CANCELLED: "Order was cancelled before manufacturing began.",
};

export const ACTIVE_STATUSES: OrderStatus[] = [
  "SUBMITTED",
  "AWAITING_APPROVAL",
  "CHANGES_REQUESTED",
  "APPROVED",
  "ORDERED_FROM_SUPPLIER",
  "SUPPLIER_CONFIRMED",
  "ARTWORK_IN_PREPARATION",
  "ARTWORK_APPROVED",
  "IN_MANUFACTURING",
  "QUALITY_CHECK",
  "READY_FOR_COLLECTION",
  "RECEIVED_AT_OFFICE",
  "BEING_PACKED",
  "COURIER_BOOKED",
  "BEING_COURIERED",
  "OUT_FOR_DELIVERY",
];

export const MANUFACTURING_STATUSES: OrderStatus[] = [
  "ARTWORK_IN_PREPARATION",
  "ARTWORK_APPROVED",
  "IN_MANUFACTURING",
  "QUALITY_CHECK",
];

export const COURIER_STATUSES: OrderStatus[] = [
  "COURIER_BOOKED",
  "BEING_COURIERED",
  "OUT_FOR_DELIVERY",
];

// ---------------------------------------------------------------------------
// Approvals
// ---------------------------------------------------------------------------

export const APPROVAL_STATUSES = [
  "AWAITING_REVIEW",
  "APPROVED",
  "DECLINED",
  "CHANGES_REQUESTED",
  "NOT_REQUIRED",
] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  AWAITING_REVIEW: "Awaiting Review",
  APPROVED: "Approved",
  DECLINED: "Declined",
  CHANGES_REQUESTED: "Changes Requested",
  NOT_REQUIRED: "Not Required",
};

// ---------------------------------------------------------------------------
// Urgency
// ---------------------------------------------------------------------------

export const URGENCY_LEVELS = ["NORMAL", "PRIORITY", "URGENT", "CRITICAL"] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  NORMAL: "Normal",
  PRIORITY: "Priority",
  URGENT: "Urgent",
  CRITICAL: "Critical",
};

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

export const DELIVERY_METHODS = [
  "COLLECT_FROM_OFFICE",
  "DELIVER_TO_OFFICE",
  "COURIER_TO_AGENT",
  "COURIER_TO_CLIENT",
  "SUPPLIER_COLLECTION",
  "OTHER",
] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  COLLECT_FROM_OFFICE: "Collect from Office",
  DELIVER_TO_OFFICE: "Deliver to Office",
  COURIER_TO_AGENT: "Courier to Agent",
  COURIER_TO_CLIENT: "Courier Directly to Client",
  SUPPLIER_COLLECTION: "Supplier Collection",
  OTHER: "Other",
};

// ---------------------------------------------------------------------------
// Stock / file kinds / notifications
// ---------------------------------------------------------------------------

export const STOCK_STATUSES = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "MADE_TO_ORDER"] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  IN_STOCK: "In Stock",
  LOW_STOCK: "Low Stock",
  OUT_OF_STOCK: "Out of Stock",
  MADE_TO_ORDER: "Made to Order",
};

export const FILE_KINDS = [
  "ARTWORK",
  "LOGO",
  "DOCUMENT",
  "REFERENCE_IMAGE",
  "PROOF_OF_DELIVERY",
  "INVOICE",
  "QUOTATION",
  "OTHER",
] as const;
export type FileKind = (typeof FILE_KINDS)[number];

export const FILE_KIND_LABELS: Record<FileKind, string> = {
  ARTWORK: "Artwork",
  LOGO: "Logo",
  DOCUMENT: "Supporting Document",
  REFERENCE_IMAGE: "Reference Image",
  PROOF_OF_DELIVERY: "Proof of Delivery",
  INVOICE: "Invoice",
  QUOTATION: "Quotation",
  OTHER: "Other",
};

export const NOTIFICATION_TYPES = [
  "ORDER_SUBMITTED",
  "APPROVAL_REQUIRED",
  "ORDER_APPROVED",
  "ORDER_DECLINED",
  "CHANGES_REQUESTED",
  "ORDERED_FROM_SUPPLIER",
  "MANUFACTURING_STARTED",
  "READY_FOR_COLLECTION",
  "COURIER_BOOKED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "ORDER_OVERDUE",
  "DUE_DATE_APPROACHING",
  "GENERAL",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  ORDER_SUBMITTED: "New order submitted",
  APPROVAL_REQUIRED: "Approval required",
  ORDER_APPROVED: "Order approved",
  ORDER_DECLINED: "Order declined",
  CHANGES_REQUESTED: "Changes requested",
  ORDERED_FROM_SUPPLIER: "Order placed with supplier",
  MANUFACTURING_STARTED: "Manufacturing started",
  READY_FOR_COLLECTION: "Ready for collection",
  COURIER_BOOKED: "Courier booked",
  OUT_FOR_DELIVERY: "Order out for delivery",
  DELIVERED: "Order delivered",
  ORDER_OVERDUE: "Order overdue",
  DUE_DATE_APPROACHING: "Required date approaching",
  GENERAL: "Notification",
};

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

export function isManager(role: Role) {
  return MANAGER_ROLES.includes(role);
}

export function isAdmin(role: Role) {
  return role === "ADMIN";
}

export function canApprove(role: Role) {
  return isManager(role) || isAdmin(role);
}

export function canManageCatalogue(role: Role) {
  return isAdmin(role);
}

export function canSeeAllOrders(role: Role) {
  return isAdmin(role) || isManager(role);
}
