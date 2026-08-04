import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-helpers";
import { canSeeAllOrders, ACTIVE_STATUSES, type OrderStatus } from "@/lib/constants";

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!canSeeAllOrders(session!.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    include: { branch: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const orders = await prisma.order.findMany({
    where: { archived: false },
    include: { items: { select: { productNameSnapshot: true, quantity: true, lineTotalEstimate: true } } },
  });

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const productTotals = new Map<string, number>();

  const agentStats = agents.map((agent) => {
    const agentOrders = orders.filter((o) => o.agentId === agent.id);
    const completed = agentOrders.filter((o) => o.status === "COMPLETED");
    const declined = agentOrders.filter((o) => o.status === "DECLINED");
    const outstanding = agentOrders.filter((o) => ACTIVE_STATUSES.includes(o.status as OrderStatus) || o.status === "DRAFT");
    const totalValue = agentOrders.reduce((sum, o) => sum + o.estimatedCost, 0);

    const processingDurations: number[] = [];
    for (const o of completed) {
      if (o.submittedAt && o.completedAt) {
        processingDurations.push((o.completedAt.getTime() - o.submittedAt.getTime()) / 864e5);
      }
    }

    for (const o of agentOrders) {
      for (const it of o.items) {
        productTotals.set(it.productNameSnapshot, (productTotals.get(it.productNameSnapshot) ?? 0) + it.quantity);
      }
    }

    const lastOrder = agentOrders.reduce<Date | null>((latest, o) => (!latest || o.createdAt > latest ? o.createdAt : latest), null);

    return {
      id: agent.id,
      name: agent.name,
      initials: agent.initials,
      avatarColor: agent.avatarColor,
      branch: agent.branch?.name ?? "—",
      ordersCount: agentOrders.length,
      totalValue,
      ordersThisWeek: agentOrders.filter((o) => o.createdAt >= startOfWeek).length,
      ordersThisMonth: agentOrders.filter((o) => o.createdAt >= startOfMonth).length,
      ordersThisYear: agentOrders.filter((o) => o.createdAt >= startOfYear).length,
      outstandingCount: outstanding.length,
      completedCount: completed.length,
      declinedCount: declined.length,
      avgOrderValue: agentOrders.length ? totalValue / agentOrders.length : 0,
      avgProcessingDays: processingDurations.length
        ? processingDurations.reduce((a, b) => a + b, 0) / processingDurations.length
        : null,
      lastOrderDate: lastOrder,
    };
  });

  const mostOrderedProducts = Array.from(productTotals.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);

  return NextResponse.json({ agents: agentStats, mostOrderedProducts });
}
