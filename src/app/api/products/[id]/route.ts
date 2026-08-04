import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, logAudit } from "@/lib/api-helpers";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  const body = await req.json();
  const product = await prisma.product.update({
    where: { id },
    data: {
      name: body.name,
      categoryId: body.categoryId,
      description: body.description || null,
      priceOnRequest: !!body.priceOnRequest,
      price: body.priceOnRequest ? null : Number(body.price) || 0,
      productionTimeDays: Number(body.productionTimeDays) || 5,
      minOrderQty: Number(body.minOrderQty) || 1,
      sizesJson: JSON.stringify(body.sizes ?? []),
      finishesJson: JSON.stringify(body.finishes ?? []),
      personalisationOptions: JSON.stringify(body.personalisation ?? []),
      supplierId: body.supplierId || null,
      stockStatus: body.stockStatus || "MADE_TO_ORDER",
      imageUrl: body.imageUrl || null,
      active: body.active ?? true,
    },
    include: { category: true, supplier: true },
  });

  await logAudit({
    userId: session!.user.id,
    action: "PRODUCT_UPDATED",
    entityType: "Product",
    entityId: product.id,
    newValue: product.name,
  });

  return NextResponse.json({ product });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  const usedInOrders = await prisma.orderItem.count({ where: { productId: id } });
  if (usedInOrders > 0) {
    const product = await prisma.product.update({ where: { id }, data: { active: false } });
    await logAudit({
      userId: session!.user.id,
      action: "PRODUCT_DEACTIVATED",
      entityType: "Product",
      entityId: id,
      newValue: product.name,
    });
    return NextResponse.json({ ok: true, deactivated: true });
  }

  await prisma.product.delete({ where: { id } });
  await logAudit({ userId: session!.user.id, action: "PRODUCT_DELETED", entityType: "Product", entityId: id });

  return NextResponse.json({ ok: true, deactivated: false });
}
