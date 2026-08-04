import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, logAudit } from "@/lib/api-helpers";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;
  const body = await req.json();

  const supplier = await prisma.supplier.update({
    where: { id },
    data: {
      name: body.name,
      contactPerson: body.contactPerson || null,
      email: body.email || null,
      phone: body.phone || null,
      whatsapp: body.whatsapp || null,
      address: body.address || null,
      avgTurnaroundDays: Number(body.avgTurnaroundDays) || 5,
      rating: Number(body.rating) || 4.5,
      active: body.active ?? true,
      notes: body.notes || null,
    },
  });

  await logAudit({
    userId: session!.user.id,
    action: "SUPPLIER_UPDATED",
    entityType: "Supplier",
    entityId: supplier.id,
    newValue: supplier.name,
  });

  return NextResponse.json({ supplier });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  const linked = await prisma.product.count({ where: { supplierId: id } });
  if (linked > 0) {
    const supplier = await prisma.supplier.update({ where: { id }, data: { active: false } });
    await logAudit({
      userId: session!.user.id,
      action: "SUPPLIER_DEACTIVATED",
      entityType: "Supplier",
      entityId: id,
      newValue: supplier.name,
    });
    return NextResponse.json({ ok: true, deactivated: true });
  }

  await prisma.supplier.delete({ where: { id } });
  await logAudit({ userId: session!.user.id, action: "SUPPLIER_DELETED", entityType: "Supplier", entityId: id });
  return NextResponse.json({ ok: true, deactivated: false });
}
