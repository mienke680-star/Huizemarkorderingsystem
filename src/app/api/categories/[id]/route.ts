import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, logAudit } from "@/lib/api-helpers";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  const body = await req.json();
  const category = await prisma.productCategory.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description || null,
      icon: body.icon || "Package",
    },
  });

  await logAudit({
    userId: session!.user.id,
    action: "CATEGORY_UPDATED",
    entityType: "ProductCategory",
    entityId: category.id,
    newValue: category.name,
  });

  return NextResponse.json({ category });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete a category that still has products. Move or remove its products first." },
      { status: 400 }
    );
  }

  await prisma.productCategory.delete({ where: { id } });
  await logAudit({ userId: session!.user.id, action: "CATEGORY_DELETED", entityType: "ProductCategory", entityId: id });

  return NextResponse.json({ ok: true });
}
