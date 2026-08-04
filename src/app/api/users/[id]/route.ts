import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, logAudit } from "@/lib/api-helpers";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const user = await prisma.user.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      role: body.role ?? existing.role,
      branchId: body.branchId !== undefined ? body.branchId || null : existing.branchId,
      phone: body.phone !== undefined ? body.phone : existing.phone,
      active: body.active !== undefined ? body.active : existing.active,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      initials: true,
      avatarColor: true,
      phone: true,
      active: true,
      branchId: true,
    },
  });

  await logAudit({
    userId: session!.user.id,
    action: "USER_UPDATED",
    entityType: "User",
    entityId: user.id,
    previousValue: `${existing.role}/${existing.active}`,
    newValue: `${user.role}/${user.active}`,
  });

  return NextResponse.json({ user });
}
