import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin, logAudit } from "@/lib/api-helpers";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
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
      createdAt: true,
      branch: { select: { id: true, name: true } },
      _count: { select: { ordersCreated: true } },
    },
  });

  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const body = await req.json();
  const existing = await prisma.user.findUnique({ where: { email: String(body.email).toLowerCase() } });
  if (existing) return NextResponse.json({ error: "A user with this email already exists." }, { status: 400 });

  const passwordHash = await bcrypt.hash(body.password || "Huizemark2026!", 10);
  const initials = String(body.name)
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: String(body.email).toLowerCase(),
      passwordHash,
      role: body.role,
      initials,
      avatarColor: body.role === "AGENT" ? "#F2801E" : "#1B2A4A",
      branchId: body.branchId || null,
      phone: body.phone || null,
      active: true,
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
    action: "USER_CREATED",
    entityType: "User",
    entityId: user.id,
    newValue: `${user.name} (${user.role})`,
  });

  return NextResponse.json({ user }, { status: 201 });
}
