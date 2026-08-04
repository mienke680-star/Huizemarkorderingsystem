import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, logAudit } from "@/lib/api-helpers";
import { generateOrderNumber } from "@/lib/order-number";
import { canSeeAllOrders } from "@/lib/constants";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;
  const { id } = await params;

  const original = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!original) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const seeAll = canSeeAllOrders(session!.user.role);
  if (!seeAll && original.agentId !== session!.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orderNumber = await generateOrderNumber();
  const duplicate = await prisma.order.create({
    data: {
      orderNumber,
      agentId: original.agentId,
      branchId: original.branchId,
      status: "DRAFT",
      urgency: original.urgency,
      deliveryMethod: original.deliveryMethod,
      deliveryAddress: original.deliveryAddress,
      agentContact: original.agentContact,
      motivation: original.motivation,
      costCentre: original.costCentre,
      notes: original.notes,
      supplierPreference: original.supplierPreference,
      supplierId: original.supplierId,
      estimatedCost: original.estimatedCost,
      requiredApprovalsJson: original.requiredApprovalsJson,
      items: {
        create: original.items.map((it) => ({
          productId: it.productId,
          productNameSnapshot: it.productNameSnapshot,
          quantity: it.quantity,
          size: it.size,
          colour: it.colour,
          material: it.material,
          finish: it.finish,
          customWording: it.customWording,
          unitPriceEstimate: it.unitPriceEstimate,
          lineTotalEstimate: it.lineTotalEstimate,
        })),
      },
      statusHistory: {
        create: [
          {
            status: "DRAFT",
            changedById: session!.user.id,
            note: `Duplicated from ${original.orderNumber}.`,
          },
        ],
      },
    },
  });

  await logAudit({
    userId: session!.user.id,
    action: "ORDER_DUPLICATED",
    entityType: "Order",
    entityId: duplicate.id,
    orderNumber: duplicate.orderNumber,
    previousValue: original.orderNumber,
  });

  return NextResponse.json({ order: duplicate }, { status: 201 });
}
