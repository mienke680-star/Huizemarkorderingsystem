import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-helpers";
import { canSeeAllOrders, URGENCY_LABELS, DELIVERY_METHOD_LABELS, type UrgencyLevel, type DeliveryMethod } from "@/lib/constants";

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!canSeeAllOrders(session!.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orders = await prisma.order.findMany({
    where: { archived: false },
    include: {
      items: { select: { lineTotalEstimate: true, product: { select: { category: { select: { name: true } } } } } },
      supplier: { select: { name: true } },
    },
  });

  const byCategory = new Map<string, number>();
  const bySupplier = new Map<string, number>();
  const byUrgency = new Map<string, number>();
  const byDeliveryMethod = new Map<string, number>();

  for (const o of orders) {
    byUrgency.set(o.urgency, (byUrgency.get(o.urgency) ?? 0) + 1);
    byDeliveryMethod.set(o.deliveryMethod, (byDeliveryMethod.get(o.deliveryMethod) ?? 0) + 1);
    if (o.supplier) bySupplier.set(o.supplier.name, (bySupplier.get(o.supplier.name) ?? 0) + o.estimatedCost);
    for (const it of o.items) {
      const cat = it.product?.category?.name ?? "Uncategorised";
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + it.lineTotalEstimate);
    }
  }

  const colors = ["#ff6b00", "#142244", "#4c6094", "#10b981", "#f59e0b", "#0ea5e9", "#ef4444", "#9aa3b5"];

  const categoryData = Array.from(byCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value], i) => ({ name, value: Math.round(value), color: colors[i % colors.length] }));

  const supplierData = Array.from(bySupplier.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value: Math.round(value) }));

  const urgencyData = Array.from(byUrgency.entries()).map(([key, value], i) => ({
    name: URGENCY_LABELS[key as UrgencyLevel] ?? key,
    value,
    color: colors[i % colors.length],
  }));

  const deliveryData = Array.from(byDeliveryMethod.entries()).map(([key, value]) => ({
    name: DELIVERY_METHOD_LABELS[key as DeliveryMethod] ?? key,
    value,
  }));

  return NextResponse.json({ categoryData, supplierData, urgencyData, deliveryData });
}
