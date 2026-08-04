import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/constants";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, response: null };
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!isAdmin(session.user.role)) {
    return { session, response: NextResponse.json({ error: "Administrator access required" }, { status: 403 }) };
  }
  return { session, response: null };
}

export async function logAudit(opts: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  orderNumber?: string | null;
  previousValue?: string | null;
  newValue?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      userId: opts.userId ?? null,
      action: opts.action,
      entityType: opts.entityType,
      entityId: opts.entityId ?? null,
      orderNumber: opts.orderNumber ?? null,
      previousValue: opts.previousValue ?? null,
      newValue: opts.newValue ?? null,
    },
  });
}
