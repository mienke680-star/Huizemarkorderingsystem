import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, logAudit } from "@/lib/api-helpers";
import { notify } from "@/lib/notify";
import { canSeeAllOrders, ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus, type NotificationType } from "@/lib/constants";

const statusIndex = (s: string) => ORDER_STATUSES.indexOf(s as OrderStatus);

const STATUS_NOTIFICATIONS: Partial<Record<OrderStatus, NotificationType>> = {
  ORDERED_FROM_SUPPLIER: "ORDERED_FROM_SUPPLIER",
  IN_MANUFACTURING: "MANUFACTURING_STARTED",
  READY_FOR_COLLECTION: "READY_FOR_COLLECTION",
  COURIER_BOOKED: "COURIER_BOOKED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;
  const { id } = await params;

  const body = await req.json();
  const targetStatus: OrderStatus = body.status;
  if (!ORDER_STATUSES.includes(targetStatus)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const isOwner = order.agentId === session!.user.id;
  const seeAll = canSeeAllOrders(session!.user.role);

  if (!seeAll) {
    const canCancelOwnOrder = isOwner && targetStatus === "CANCELLED" && statusIndex(order.status) < statusIndex("IN_MANUFACTURING");
    if (!canCancelOwnOrder) {
      return NextResponse.json({ error: "You are not permitted to update order status." }, { status: 403 });
    }
  }

  if (statusIndex(targetStatus) >= statusIndex("ORDERED_FROM_SUPPLIER") && statusIndex(order.status) < statusIndex("APPROVED")) {
    return NextResponse.json(
      { error: "All required approvals must be completed before this order can move to manufacturing/fulfilment." },
      { status: 400 }
    );
  }

  const now = new Date();
  await prisma.order.update({
    where: { id },
    data: {
      status: targetStatus,
      completedAt: targetStatus === "COMPLETED" ? now : order.completedAt,
      estimatedCompletionDate: body.estimatedCompletionDate ? new Date(body.estimatedCompletionDate) : order.estimatedCompletionDate,
      trackingNumber: body.trackingNumber ?? order.trackingNumber,
      courierName: body.courierName ?? order.courierName,
      actualCost: body.actualCost !== undefined ? Number(body.actualCost) : order.actualCost,
    },
  });

  await prisma.orderStatusHistory.create({
    data: {
      orderId: id,
      status: targetStatus,
      changedById: session!.user.id,
      note: body.note || null,
      fileUrl: body.fileUrl || null,
      estimatedNextStep: body.estimatedNextStep || null,
      estimatedCompletionDate: body.estimatedCompletionDate ? new Date(body.estimatedCompletionDate) : null,
      createdAt: now,
    },
  });

  const notifType = STATUS_NOTIFICATIONS[targetStatus];
  if (notifType) {
    await notify({
      userId: order.agentId,
      type: notifType,
      title: `${ORDER_STATUS_LABELS[targetStatus]} — ${order.orderNumber}`,
      body: body.note || `Your order status was updated to ${ORDER_STATUS_LABELS[targetStatus]}.`,
      orderId: order.id,
    });
  }

  await logAudit({
    userId: session!.user.id,
    action: "STATUS_CHANGED",
    entityType: "Order",
    entityId: id,
    orderNumber: order.orderNumber,
    previousValue: order.status,
    newValue: targetStatus,
  });

  const updated = await prisma.order.findUnique({ where: { id } });
  return NextResponse.json({ order: updated });
}
