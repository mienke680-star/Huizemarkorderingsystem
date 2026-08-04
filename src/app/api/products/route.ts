import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession, logAudit } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const { response } = await requireSession();
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q");
  const includeInactive = searchParams.get("includeInactive") === "true";

  const products = await prisma.product.findMany({
    where: {
      ...(includeInactive ? {} : { active: true }),
      ...(category ? { categoryId: category } : {}),
      ...(q ? { name: { contains: q } } : {}),
    },
    include: {
      category: { select: { id: true, name: true, slug: true, icon: true } },
      supplier: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const body = await req.json();

  const product = await prisma.product.create({
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
    action: "PRODUCT_CREATED",
    entityType: "Product",
    entityId: product.id,
    newValue: product.name,
  });

  return NextResponse.json({ product }, { status: 201 });
}
