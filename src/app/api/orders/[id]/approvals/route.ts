import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, logAudit } from "@/lib/api-helpers";
import { notify } from "@/lib/notify";
import { canApprove } from "@/lib/constants";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;
  const { id } = await params;

  if (!canApprove(session!.user.role)) {
    return NextResponse.json({ error: "You are not permitted to approve orders." }, { status: 403 });
  }

  const body = await req.json();
  const decision: "APPROVED" | "DECLINED" | "CHANGES_REQUESTED" = body.decision;
  if (!["APPROVED", "DECLINED", "CHANGES_REQUESTED"].includes(decision)) {
    return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id }, include: { approvals: true, agent: true } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (!["AWAITING_APPROVAL", "SUBMITTED"].includes(order.status)) {
    return NextResponse.json({ error: "This order is not currently awaiting approval." }, { status: 400 });
  }

  const myApproval = order.approvals.find((a) => a.approverRole === session!.user.role);
  if (!myApproval || !myApproval.required) {
    return NextResponse.json({ error: "You are not a required approver for this order." }, { status: 403 });
  }
  if (myApproval.status !== "AWAITING_REVIEW") {
    return NextResponse.json({ error: "You have already responded to this order." }, { status: 400 });
  }

  const now = new Date();
  await prisma.orderApproval.update({
    where: { id: myApproval.id },
    data: { status: decision, comment: body.comment || null, respondedAt: now, respondedById: session!.user.id },
  });

  let newOrderStatus = order.status;
  let historyNote = body.comment || undefined;

  if (decision === "DECLINED") {
    newOrderStatus = "DECLINED";
    await prisma.order.update({ where: { id }, data: { status: newOrderStatus } });
    await prisma.orderStatusHistory.create({
      data: { orderId: id, status: "DECLINED", changedById: session!.user.id, note: body.comment || "Order declined.", createdAt: now },
    });
    await notify({
      userId: order.agentId,
      type: "ORDER_DECLINED",
      title: `Order declined — ${order.orderNumber}`,
      body: body.comment ? `${session!.user.name}: ${body.comment}` : `${session!.user.name} declined your order.`,
      orderId: order.id,
    });
  } else if (decision === "CHANGES_REQUESTED") {
    newOrderStatus = "CHANGES_REQUESTED";
    await prisma.order.update({ where: { id }, data: { status: newOrderStatus } });
    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: "CHANGES_REQUESTED",
        changedById: session!.user.id,
        note: body.comment || "Changes requested.",
        createdAt: now,
      },
    });
    await notify({
      userId: order.agentId,
      type: "CHANGES_REQUESTED",
      title: `Changes requested — ${order.orderNumber}`,
      body: body.comment
        ? `${session!.user.name} requested changes: ${body.comment}`
        : `${session!.user.name} requested changes to your order.`,
      orderId: order.id,
    });
  } else {
    // APPROVED — check whether every required approval is now complete
    const remaining = order.approvals.filter(
      (a) => a.required && a.approverRole !== session!.user.role && a.status !== "APPROVED"
    );
    const approvedCount = order.approvals.filter((a) => a.required && a.status === "APPROVED").length + 1;
    const requiredCount = order.approvals.filter((a) => a.required).length;
    historyNote = `${session!.user.name} approved (${approvedCount} of ${requiredCount}).${body.comment ? ` "${body.comment}"` : ""}`;

    if (remaining.length === 0) {
      newOrderStatus = "APPROVED";
      await prisma.order.update({ where: { id }, data: { status: newOrderStatus } });
      await prisma.orderStatusHistory.create({
        data: { orderId: id, status: "APPROVED", changedById: session!.user.id, note: historyNote, createdAt: now },
      });
      await notify({
        userId: order.agentId,
        type: "ORDER_APPROVED",
        title: `Order approved — ${order.orderNumber}`,
        body: "All required approvals are complete. Your order will now be placed with the supplier.",
        orderId: order.id,
      });
    } else {
      await prisma.orderStatusHistory.create({
        data: { orderId: id, status: order.status, changedById: session!.user.id, note: historyNote, createdAt: now },
      });
    }
  }

  await logAudit({
    userId: session!.user.id,
    action: `APPROVAL_${decision}`,
    entityType: "Order",
    entityId: id,
    orderNumber: order.orderNumber,
    previousValue: "AWAITING_REVIEW",
    newValue: decision,
  });

  const updated = await prisma.order.findUnique({
    where: { id },
    include: { approvals: { include: { respondedBy: { select: { name: true, initials: true, avatarColor: true } } } } },
  });

  return NextResponse.json({ order: updated });
}
