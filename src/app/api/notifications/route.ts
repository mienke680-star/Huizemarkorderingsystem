import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ACTIVE_STATUSES, type OrderStatus } from "@/lib/constants";

// Lazily generates "due date approaching" / "overdue" notifications for the
// current agent's own orders. There's no cron in this environment, so this
// runs opportunistically whenever the bell/notification centre is opened,
// de-duplicated by checking for an existing notification of that type.
async function checkDueDates(userId: string) {
  const now = new Date();
  const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: {
      agentId: userId,
      archived: false,
      status: { in: ACTIVE_STATUSES as unknown as string[] },
      requiredDate: { not: null },
    },
    select: { id: true, orderNumber: true, requiredDate: true, status: true },
  });

  for (const o of orders) {
    if (!o.requiredDate) continue;
    const type = o.requiredDate < now ? "ORDER_OVERDUE" : o.requiredDate <= in2Days ? "DUE_DATE_APPROACHING" : null;
    if (!type) continue;

    const existing = await prisma.notification.findFirst({
      where: { userId, orderId: o.id, type, createdAt: { gte: new Date(now.getTime() - 20 * 60 * 60 * 1000) } },
    });
    if (existing) continue;

    await prisma.notification.create({
      data: {
        userId,
        orderId: o.id,
        type,
        title: type === "ORDER_OVERDUE" ? `Order overdue — ${o.orderNumber}` : `Required date approaching — ${o.orderNumber}`,
        body:
          type === "ORDER_OVERDUE"
            ? "This order has passed its required date and is still in progress."
            : "This order's required date is within the next 2 days.",
      },
    });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role === "AGENT") {
    await checkDueDates(session.user.id).catch(() => undefined);
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { order: { select: { orderNumber: true } } },
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, read: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}
