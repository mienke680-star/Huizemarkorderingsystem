import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, logAudit } from "@/lib/api-helpers";
import { generateOrderNumber } from "@/lib/order-number";
import { notify } from "@/lib/notify";
import { canSeeAllOrders, isAdmin, MANAGER_ROLES, ROLE_LABELS, type Role } from "@/lib/constants";

export async function GET(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const seeAll = canSeeAllOrders(session!.user.role);

  const status = searchParams.get("status");
  const urgency = searchParams.get("urgency");
  const agentId = searchParams.get("agentId");
  const branchId = searchParams.get("branchId");
  const supplierId = searchParams.get("supplierId");
  const categoryId = searchParams.get("categoryId");
  const deliveryMethod = searchParams.get("deliveryMethod");
  const approverRole = searchParams.get("approverRole");
  const q = searchParams.get("q");
  const archived = searchParams.get("archived") === "true";
  const mine = searchParams.get("mine") === "true";
  const awaitingMyApproval = searchParams.get("awaitingMyApproval") === "true";

  const where: Record<string, unknown> = { archived };

  if (!seeAll || mine) where.agentId = session!.user.id;
  else if (agentId) where.agentId = agentId;

  if (status) where.status = status;
  if (urgency) where.urgency = urgency;
  if (branchId) where.branchId = branchId;
  if (supplierId) where.supplierId = supplierId;
  if (deliveryMethod) where.deliveryMethod = deliveryMethod;
  if (categoryId) where.items = { some: { product: { categoryId } } };
  if (approverRole) where.approvals = { some: { approverRole } };
  if (awaitingMyApproval) {
    where.approvals = { some: { approverRole: session!.user.role, status: "AWAITING_REVIEW" } };
  }
  if (q) {
    where.OR = [
      { orderNumber: { contains: q } },
      { trackingNumber: { contains: q } },
      { notes: { contains: q } },
      { motivation: { contains: q } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      agent: { select: { id: true, name: true, initials: true, avatarColor: true, branch: { select: { name: true } } } },
      branch: { select: { name: true } },
      supplier: { select: { name: true } },
      items: {
        select: {
          productNameSnapshot: true,
          quantity: true,
          lineTotalEstimate: true,
          product: { select: { categoryId: true, category: { select: { name: true } } } },
        },
      },
      approvals: { select: { approverRole: true, status: true, required: true, respondedAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  const body = await req.json();
  const action: "draft" | "submit" = body.action === "submit" ? "submit" : "draft";

  const agentId = isAdmin(session!.user.role) && body.agentId ? body.agentId : session!.user.id;
  const agent = await prisma.user.findUnique({ where: { id: agentId } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 400 });

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

  const orderNumber = await generateOrderNumber();
  const now = new Date();
  const status = action === "submit" ? "AWAITING_APPROVAL" : "DRAFT";

  const estimatedCost = items.reduce(
    (sum: number, it: { quantity: number; unitPrice?: number }) => sum + (it.unitPrice ?? 0) * (it.quantity ?? 1),
    0
  );

  const order = await prisma.order.create({
    data: {
      orderNumber,
      agentId: agent.id,
      branchId: body.branchId || agent.branchId || null,
      status,
      urgency: body.urgency || "NORMAL",
      deliveryMethod: body.deliveryMethod || "COLLECT_FROM_OFFICE",
      deliveryAddress: body.deliveryAddress || null,
      requiredDate: body.requiredDate ? new Date(body.requiredDate) : null,
      agentContact: body.agentContact || agent.phone || null,
      motivation: body.motivation || null,
      costCentre: body.costCentre || null,
      notes: body.notes || null,
      supplierPreference: body.supplierPreference || null,
      supplierId: body.supplierId || null,
      estimatedCost,
      requiredApprovalsJson: JSON.stringify(requiredApprovals),
      submittedAt: action === "submit" ? now : null,
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
      approvals: {
        create: MANAGER_ROLES.map((role) => ({
          approverRole: role,
          required: requiredApprovals.includes(role),
          status: requiredApprovals.includes(role) ? "AWAITING_REVIEW" : "NOT_REQUIRED",
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
        create: [
          { status: "DRAFT", changedById: session!.user.id, note: "Order created.", createdAt: now },
          ...(action === "submit"
            ? [
                { status: "SUBMITTED", changedById: session!.user.id, note: "Order submitted for approval.", createdAt: now },
                { status: "AWAITING_APPROVAL", changedById: session!.user.id, createdAt: now },
              ]
            : []),
        ],
      },
    },
  });

  await logAudit({
    userId: session!.user.id,
    action: action === "submit" ? "ORDER_SUBMITTED" : "ORDER_CREATED",
    entityType: "Order",
    entityId: order.id,
    orderNumber: order.orderNumber,
    newValue: status,
  });

  if (action === "submit") {
    const managers = await prisma.user.findMany({ where: { role: { in: requiredApprovals }, active: true } });
    for (const m of managers) {
      await notify({
        userId: m.id,
        type: "APPROVAL_REQUIRED",
        title: `Approval required — ${orderNumber}`,
        body: `${agent.name} submitted an order awaiting your approval.`,
        orderId: order.id,
      });
    }
    await notify({
      userId: agent.id,
      type: "ORDER_SUBMITTED",
      title: `Order submitted — ${orderNumber}`,
      body: `Your order has been submitted and is awaiting approval from ${requiredApprovals
        .map((r) => ROLE_LABELS[r])
        .join(", ")}.`,
      orderId: order.id,
    });
  }

  return NextResponse.json({ order }, { status: 201 });
}
