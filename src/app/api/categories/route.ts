import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession, logAudit } from "@/lib/api-helpers";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  const categories = await prisma.productCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const body = await req.json();
  const slug = String(body.name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const maxSort = await prisma.productCategory.aggregate({ _max: { sortOrder: true } });

  const category = await prisma.productCategory.create({
    data: {
      name: body.name,
      slug,
      description: body.description || null,
      icon: body.icon || "Package",
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
  });

  await logAudit({
    userId: session!.user.id,
    action: "CATEGORY_CREATED",
    entityType: "ProductCategory",
    entityId: category.id,
    newValue: category.name,
  });

  return NextResponse.json({ category }, { status: 201 });
}
