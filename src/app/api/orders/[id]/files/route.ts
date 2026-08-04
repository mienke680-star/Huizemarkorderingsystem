import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, logAudit } from "@/lib/api-helpers";
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
  const file = await prisma.orderFile.create({
    data: {
      orderId: id,
      fileName: body.name,
      fileUrl: body.url,
      fileKind: body.kind || "OTHER",
      uploadedById: session!.user.id,
    },
    include: { uploadedBy: { select: { name: true } } },
  });

  await logAudit({
    userId: session!.user.id,
    action: "FILE_UPLOADED",
    entityType: "Order",
    entityId: id,
    orderNumber: order.orderNumber,
    newValue: body.name,
  });

  return NextResponse.json({ file }, { status: 201 });
}
