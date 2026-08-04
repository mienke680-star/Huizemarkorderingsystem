import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession, logAudit } from "@/lib/api-helpers";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true, orders: true } } },
  });
  return NextResponse.json({ suppliers });
}

export async function POST(req: Request) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const body = await req.json();

  const supplier = await prisma.supplier.create({
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
    action: "SUPPLIER_CREATED",
    entityType: "Supplier",
    entityId: supplier.id,
    newValue: supplier.name,
  });

  return NextResponse.json({ supplier }, { status: 201 });
}
