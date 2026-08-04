import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canSeeAllOrders } from "@/lib/constants";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ orders: [], products: [], suppliers: [], agents: [] });

  const seeAll = canSeeAllOrders(session.user.role);

  const orders = await prisma.order.findMany({
    where: {
      AND: [
        seeAll ? {} : { agentId: session.user.id },
        {
          OR: [
            { orderNumber: { contains: q } },
            { trackingNumber: { contains: q } },
            { notes: { contains: q } },
            { motivation: { contains: q } },
            { agent: { name: { contains: q } } },
          ],
        },
      ],
    },
    include: { agent: { select: { name: true } } },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  const products = await prisma.product.findMany({
    where: { name: { contains: q } },
    include: { category: { select: { name: true } } },
    take: 6,
  });

  const suppliers = seeAll
    ? await prisma.supplier.findMany({ where: { name: { contains: q } }, take: 6 })
    : [];

  const agents = seeAll
    ? await prisma.user.findMany({
        where: { role: "AGENT", name: { contains: q } },
        take: 6,
      })
    : [];

  return NextResponse.json({ orders, products, suppliers, agents });
}
