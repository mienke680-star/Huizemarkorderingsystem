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

  const orders = await prisma.order.findMany({
    where: { archived: false },
    include: {
      agent: { select: { name: true } },
      statusHistory: { select: { status: true, createdAt: true }, orderBy: { createdAt: "asc" } },
    },
  });

  const rows = orders
    .filter((o) => o.submittedAt)
    .map((o) => {
      const approvedEntry = o.statusHistory.find((h) => h.status === "APPROVED");
      const manufacturingStart = o.statusHistory.find((h) => h.status === "IN_MANUFACTURING");
      const manufacturingEnd = o.statusHistory.find((h) => h.status === "READY_FOR_COLLECTION" || h.status === "QUALITY_CHECK");

      const approvalHours = approvedEntry && o.submittedAt ? (approvedEntry.createdAt.getTime() - o.submittedAt.getTime()) / 36e5 : null;
      const manufacturingDays =
        manufacturingStart && manufacturingEnd && manufacturingEnd.createdAt > manufacturingStart.createdAt
          ? (manufacturingEnd.createdAt.getTime() - manufacturingStart.createdAt.getTime()) / 864e5
          : null;

      return {
        orderNumber: o.orderNumber,
        agent: o.agent.name,
        status: o.status,
        submittedAt: o.submittedAt,
        approvedAt: approvedEntry?.createdAt ?? null,
        approvalHours,
        manufacturingStart: manufacturingStart?.createdAt ?? null,
        manufacturingEnd: manufacturingEnd?.createdAt ?? null,
        manufacturingDays,
      };
    });

  return NextResponse.json({ rows });
}
