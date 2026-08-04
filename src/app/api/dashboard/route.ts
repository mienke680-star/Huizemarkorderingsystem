import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ORDER_STATUSES,
  MANUFACTURING_STATUSES,
  COURIER_STATUSES,
  canSeeAllOrders,
  type OrderStatus,
} from "@/lib/constants";

const statusIndex = (s: string) => ORDER_STATUSES.indexOf(s as OrderStatus);

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const seeAll = canSeeAllOrders(session.user.role);
  const where = seeAll ? { archived: false } : { agentId: session.user.id, archived: false };

  const orders = await prisma.order.findMany({
    where,
    include: {
      agent: { select: { id: true, name: true, initials: true, avatarColor: true } },
      items: { select: { quantity: true, lineTotalEstimate: true, productNameSnapshot: true } },
      approvals: { select: { approverRole: true, status: true } },
      statusHistory: { select: { status: true, createdAt: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const draftOrders = orders.filter((o) => o.status === "DRAFT").length;
  const awaitingApproval = orders.filter((o) => ["SUBMITTED", "AWAITING_APPROVAL"].includes(o.status)).length;
  const changesRequested = orders.filter((o) => o.status === "CHANGES_REQUESTED").length;
  const approvedOrders = orders.filter(
    (o) => statusIndex(o.status) >= statusIndex("APPROVED") && !["DECLINED", "CANCELLED"].includes(o.status)
  ).length;
  const inManufacturing = orders.filter((o) => MANUFACTURING_STATUSES.includes(o.status as OrderStatus)).length;
  const readyForCollection = orders.filter((o) => o.status === "READY_FOR_COLLECTION").length;
  const beingCouriered = orders.filter((o) => COURIER_STATUSES.includes(o.status as OrderStatus)).length;
  const completedOrders = orders.filter((o) => o.status === "COMPLETED").length;
  const declinedOrders = orders.filter((o) => o.status === "DECLINED").length;
  const cancelledOrders = orders.filter((o) => o.status === "CANCELLED").length;
  const urgentOrders = orders.filter((o) => ["URGENT", "CRITICAL"].includes(o.urgency)).length;
  const ordersThisMonth = orders.filter((o) => o.createdAt >= startOfMonth).length;
  const estimatedMonthlyValue = orders
    .filter((o) => o.createdAt >= startOfMonth)
    .reduce((sum, o) => sum + o.estimatedCost, 0);

  // Approval turnaround (submitted -> first APPROVED status entry), in hours
  const approvalDurations: number[] = [];
  for (const o of orders) {
    if (!o.submittedAt) continue;
    const approvedEntry = o.statusHistory.find((h) => h.status === "APPROVED");
    if (approvedEntry) {
      approvalDurations.push((approvedEntry.createdAt.getTime() - o.submittedAt.getTime()) / 36e5);
    }
  }
  const avgApprovalTimeHours = approvalDurations.length
    ? approvalDurations.reduce((a, b) => a + b, 0) / approvalDurations.length
    : 0;

  // Manufacturing turnaround (IN_MANUFACTURING -> QUALITY_CHECK/READY_FOR_COLLECTION), in days
  const manufacturingDurations: number[] = [];
  for (const o of orders) {
    const start = o.statusHistory.find((h) => h.status === "IN_MANUFACTURING");
    const end = o.statusHistory.find((h) => h.status === "READY_FOR_COLLECTION" || h.status === "QUALITY_CHECK");
    if (start && end && end.createdAt > start.createdAt) {
      manufacturingDurations.push((end.createdAt.getTime() - start.createdAt.getTime()) / 864e5);
    }
  }
  const avgManufacturingTimeDays = manufacturingDurations.length
    ? manufacturingDurations.reduce((a, b) => a + b, 0) / manufacturingDurations.length
    : 0;

  const statusCounts: Record<string, number> = {};
  for (const s of ORDER_STATUSES) statusCounts[s] = 0;
  for (const o of orders) statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;

  // Monthly trend — last 6 months
  const monthlyTrend: { month: string; orders: number; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const inMonth = orders.filter((o) => o.createdAt >= d && o.createdAt < next);
    monthlyTrend.push({
      month: d.toLocaleDateString("en-ZA", { month: "short" }),
      orders: inMonth.length,
      value: Math.round(inMonth.reduce((sum, o) => sum + o.estimatedCost, 0)),
    });
  }

  // Awaiting the current user's approval (managers only)
  const awaitingMyApproval = seeAll
    ? orders.filter((o) => o.approvals.some((a) => a.approverRole === session.user.role && a.status === "AWAITING_REVIEW"))
        .length
    : 0;

  const recentOrders = orders.slice(0, 6).map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    urgency: o.urgency,
    estimatedCost: o.estimatedCost,
    createdAt: o.createdAt,
    agent: o.agent,
    itemSummary: o.items[0]?.productNameSnapshot ?? "—",
    itemCount: o.items.length,
  }));

  return NextResponse.json({
    scope: seeAll ? "ALL" : "MINE",
    totals: {
      totalOrders: orders.length,
      draftOrders,
      awaitingApproval,
      changesRequested,
      approvedOrders,
      inManufacturing,
      readyForCollection,
      beingCouriered,
      completedOrders,
      declinedOrders,
      cancelledOrders,
      urgentOrders,
      ordersThisMonth,
      estimatedMonthlyValue,
      avgApprovalTimeHours,
      avgManufacturingTimeDays,
      awaitingMyApproval,
    },
    statusCounts,
    monthlyTrend,
    recentOrders,
  });
}
