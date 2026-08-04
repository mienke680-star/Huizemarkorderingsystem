import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, logAudit } from "@/lib/api-helpers";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const body = await req.json();
  const archived = body.archived !== false;

  const updated = await prisma.order.update({ where: { id }, data: { archived } });

  await logAudit({
    userId: session!.user.id,
    action: archived ? "ORDER_ARCHIVED" : "ORDER_RESTORED",
    entityType: "Order",
    entityId: id,
    orderNumber: order.orderNumber,
  });

  return NextResponse.json({ order: updated });
}
