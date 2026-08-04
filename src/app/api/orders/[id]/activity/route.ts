import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-helpers";
import { canSeeAllOrders } from "@/lib/constants";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;
  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id }, select: { orderNumber: true, agentId: true } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const seeAll = canSeeAllOrders(session!.user.role);
  if (!seeAll && order.agentId !== session!.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const logs = await prisma.auditLog.findMany({
    where: { orderNumber: order.orderNumber },
    include: { user: { select: { name: true, initials: true, avatarColor: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ logs });
}
