import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-helpers";
import { canSeeAllOrders } from "@/lib/constants";

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!canSeeAllOrders(session!.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    orderBy: { name: "asc" },
    include: { branch: { select: { name: true } } },
  });

  return NextResponse.json({ agents });
}
