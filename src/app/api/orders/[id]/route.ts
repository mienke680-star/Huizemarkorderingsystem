import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, logAudit } from "@/lib/api-helpers";
import { notify } from "@/lib/notify";
import { canSeeAllOrders, MANAGER_ROLES, type Role } from "@/lib/constants";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      agent: { select: { id: true, name: true, initials: true, avatarColor: true, email: true, phone: true, branch: true } },
      branch: true,
      supplier: true,
      items: { include: { product: { select: { name: true, category: { select: { name: true } } } } } },
      approvals: {
        include: { respondedBy: { select: { name: true, initials: true, avatarColor: true } } },
        orderBy: { approverRole: "asc" },
      },
      statusHistory: { include: { changedBy: { select: { name: true, initials: true, avatarColor: true } } }, orderBy: { createdAt: "asc" } },
      files: { include: { uploadedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      comments: { include: { user: { select: { name: true, initials: true, avatarColor: true, role: true } } }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const seeAll = canSeeAllOrders(session!.user.role);
  if (!seeAll && order.agentId !== session!.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ order });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;
  const { id } = await params;

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const isOwner = existing.agentId === session!.user.id;
  const seeAll = canSeeAllOrders(session!.user.role);
  if (!isOwner && !seeAll) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!["DRAFT", "CHANGES_REQUESTED"].includes(existing.status)) {
    return NextResponse.json({ error: "This order can no longer be edited." }, { status: 400 });
  }

  const body = await req.json();
  const action: "draft" | "submit" = body.action === "submit" ? "submit" : "draft";
  const items = Array.isArray(body.items) ? body.items : [];

  if (action === "submit" && items.length === 0) {
    return NextResponse.json({ error: "Add at least one item before submitting." }, { status: 400 });
  }

  const requiredApprovals: Role[] = Array.isArray(body.requiredApprovals)
    ? body.requiredApprovals.filter((r: string) => MANAGER_ROLES.includes(r as Role))
    : [];
  if (action === "submit" && requiredApprovals.length === 0) {
    return NextResponse.json({ error: "Select at least one required approver before submitting." }, { status: 400 });
  }

  const estimatedCost = items.reduce(
    (sum: number, it: { quantity: number; unitPrice?: number }) => sum + (it.unitPrice ?? 0) * (it.quantity ?? 1),
    0
  );
  const now = new Date();
  const wasChangesRequested = existing.status === "CHANGES_REQUESTED";
  const newStatus = action === "submit" ? "AWAITING_APPROVAL" : "DRAFT";

  await prisma.orderItem.deleteMany({ where: { orderId: id } });

  const order = await prisma.order.update({
    where: { id },
    data: {
      status: newStatus,
      urgency: body.urgency || existing.urgency,
      deliveryMethod: body.deliveryMethod || existing.deliveryMethod,
      deliveryAddress: body.deliveryAddress ?? existing.deliveryAddress,
      requiredDate: body.requiredDate ? new Date(body.requiredDate) : existing.requiredDate,
      agentContact: body.agentContact ?? existing.agentContact,
      motivation: body.motivation ?? existing.motivation,
      costCentre: body.costCentre ?? existing.costCentre,
      notes: body.notes ?? existing.notes,
      supplierPreference: body.supplierPreference ?? existing.supplierPreference,
      supplierId: body.supplierId ?? existing.supplierId,
      estimatedCost,
      requiredApprovalsJson: JSON.stringify(requiredApprovals),
      submittedAt: action === "submit" ? now : existing.submittedAt,
      items: {
        create: items.map((it: Record<string, unknown>) => ({
          productId: (it.productId as string) || null,
          productNameSnapshot: it.name as string,
          quantity: Number(it.quantity) || 1,
          size: (it.size as string) || null,
          colour: (it.colour as string) || null,
          material: (it.material as string) || null,
          finish: (it.finish as string) || null,
          customWording: (it.customWording as string) || null,
          unitPriceEstimate: Number(it.unitPrice) || 0,
          lineTotalEstimate: (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1),
        })),
      },
      files: {
        create: (Array.isArray(body.files) ? body.files : []).map((f: { url: string; name: string; kind: string }) => ({
          fileName: f.name,
          fileUrl: f.url,
          fileKind: f.kind,
          uploadedById: session!.user.id,
        })),
      },
      statusHistory: {
        create:
          action === "submit"
            ? [
                {
                  status: "SUBMITTED",
                  changedById: session!.user.id,
                  note: wasChangesRequested ? "Order updated and resubmitted for approval." : "Order submitted for approval.",
                  createdAt: now,
                },
                { status: "AWAITING_APPROVAL", changedById: session!.user.id, createdAt: now },
              ]
            : [{ status: "DRAFT", changedById: session!.user.id, note: "Draft updated.", createdAt: now }],
      },
    },
  });

  if (action === "submit") {
    await prisma.orderApproval.deleteMany({ where: { orderId: id } });
    await prisma.orderApproval.createMany({
      data: MANAGER_ROLES.map((role) => ({
        orderId: id,
        approverRole: role,
        required: requiredApprovals.includes(role),
        status: requiredApprovals.includes(role) ? "AWAITING_REVIEW" : "NOT_REQUIRED",
      })),
    });

    const managers = await prisma.user.findMany({ where: { role: { in: requiredApprovals }, active: true } });
    for (const m of managers) {
      await notify({
        userId: m.id,
        type: "APPROVAL_REQUIRED",
        title: `Approval required — ${order.orderNumber}`,
        body: `${session!.user.name} ${wasChangesRequested ? "resubmitted" : "submitted"} an order awaiting your approval.`,
        orderId: order.id,
      });
    }
  }

  await logAudit({
    userId: session!.user.id,
    action: action === "submit" ? "ORDER_RESUBMITTED" : "ORDER_UPDATED",
    entityType: "Order",
    entityId: order.id,
    orderNumber: order.orderNumber,
    previousValue: existing.status,
    newValue: newStatus,
  });

  return NextResponse.json({ order });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;
  const { id } = await params;

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const isOwner = existing.agentId === session!.user.id;
  if (!isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (existing.status !== "DRAFT") {
    return NextResponse.json({ error: "Only draft orders can be deleted." }, { status: 400 });
  }

  await prisma.order.delete({ where: { id } });
  await logAudit({
    userId: session!.user.id,
    action: "ORDER_DELETED",
    entityType: "Order",
    entityId: id,
    orderNumber: existing.orderNumber,
  });

  return NextResponse.json({ ok: true });
}
