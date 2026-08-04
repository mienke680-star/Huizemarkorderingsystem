import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, logAudit } from "@/lib/api-helpers";
import { notify } from "@/lib/notify";
import { canSeeAllOrders } from "@/lib/constants";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;
  const { id } = await params;

  if (!canSeeAllOrders(session!.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const body = await req.json();
  const bookingCourier = !!(body.trackingNumber && body.courierName);
  const now = new Date();

  const updated = await prisma.order.update({
    where: { id },
    data: {
      supplierId: body.supplierId ?? order.supplierId,
      trackingNumber: body.trackingNumber ?? order.trackingNumber,
      courierName: body.courierName ?? order.courierName,
      courierBookedAt: bookingCourier ? now : order.courierBookedAt,
      status: bookingCourier ? "COURIER_BOOKED" : order.status,
    },
  });

  if (body.supplierId && body.supplierId !== order.supplierId) {
    await logAudit({
      userId: session!.user.id,
      action: "SUPPLIER_ASSIGNED",
      entityType: "Order",
      entityId: id,
      orderNumber: order.orderNumber,
      newValue: body.supplierId,
    });
  }

  if (bookingCourier) {
    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: "COURIER_BOOKED",
        changedById: session!.user.id,
        note: `${body.courierName} — tracking ${body.trackingNumber}`,
        createdAt: now,
      },
    });
    await notify({
      userId: order.agentId,
      type: "COURIER_BOOKED",
      title: `Courier booked — ${order.orderNumber}`,
      body: `${body.courierName} · Tracking ${body.trackingNumber}`,
      orderId: order.id,
    });
    await logAudit({
      userId: session!.user.id,
      action: "COURIER_BOOKED",
      entityType: "Order",
      entityId: id,
      orderNumber: order.orderNumber,
      newValue: body.trackingNumber,
    });
  }

  return NextResponse.json({ order: updated });
}
