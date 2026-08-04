import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const action = searchParams.get("action");

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(action ? { action } : {}),
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q } },
              { action: { contains: q } },
              { entityType: { contains: q } },
              { newValue: { contains: q } },
            ],
          }
        : {}),
    },
    include: { user: { select: { name: true, initials: true, avatarColor: true } } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const actions = await prisma.auditLog.findMany({
    distinct: ["action"],
    select: { action: true },
    orderBy: { action: "asc" },
  });

  return NextResponse.json({ logs, actions: actions.map((a) => a.action) });
}
