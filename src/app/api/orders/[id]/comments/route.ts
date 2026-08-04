import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, logAudit } from "@/lib/api-helpers";
import { notify } from "@/lib/notify";
import { canSeeAllOrders } from "@/lib/constants";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;
  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const seeAll = canSeeAllOrders(session!.user.role);
  if (!seeAll && order.agentId !== session!.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.body || !String(body.body).trim()) {
    return NextResponse.json({ error: "Comment cannot be empty." }, { status: 400 });
  }
  const internal = seeAll && !!body.internal;

  const comment = await prisma.comment.create({
    data: { orderId: id, userId: session!.user.id, body: String(body.body).trim(), internal },
    include: { user: { select: { name: true, initials: true, avatarColor: true, role: true } } },
  });

  await logAudit({
    userId: session!.user.id,
    action: "COMMENT_ADDED",
    entityType: "Order",
    entityId: id,
    orderNumber: order.orderNumber,
  });

  if (!internal && order.agentId !== session!.user.id) {
    await notify({
      userId: order.agentId,
      type: "GENERAL",
      title: `New comment on ${order.orderNumber}`,
      body: `${session!.user.name}: ${comment.body.slice(0, 120)}`,
      orderId: order.id,
    });
  }

  return NextResponse.json({ comment }, { status: 201 });
}
